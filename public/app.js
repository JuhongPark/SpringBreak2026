const form = document.getElementById("trip-form");
const itinerarySection = document.getElementById("itinerary");
const messagesSection = document.getElementById("messages");
const activitySection = document.getElementById("activity");
const activityList = document.getElementById("activity-list");
const toolMonitorSection = document.getElementById("tool-monitor");
const toolMonitorList = document.getElementById("tool-monitor-list");
const dagViewSection = document.getElementById("dag-view");
const dagCanvas = document.getElementById("dag-canvas");
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "1";

const TOOL_MONITOR_TYPES = new Set([
  "tool_call_started",
  "tool_call_completed",
  "tool_call_failed",
  "web_search_called",
  "web_search_output",
  "tool_called",
  "tool_output"
]);

const TIMELINE_VISIBLE_LIMIT = 3;

let currentPlan = null;
let activityEvents = [];
let toolMonitorEvents = [];

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = formToPayload(new FormData(form));
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  resetTimeline();
  itinerarySection.classList.add("hidden");
  setMessage("Generating itinerary with agents...");

  try {
    const data = await streamPlan(payload);

    currentPlan = data;
    setMessage(`Draft itinerary created. Trace ID: ${data.traceId || "n/a"}. Please confirm each component.`);
    renderItinerary(currentPlan);
  } catch (error) {
    setMessage(error.message || "Unexpected error", true);
  } finally {
    submitButton.disabled = false;
  }
});

async function streamPlan(payload) {
  const response = await fetch("/api/plan-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await safeJson(response);
    throw new Error(apiErrorMessage(data, "Failed to generate itinerary"));
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let finalResult = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    pending += decoder.decode(value, { stream: true });
    const chunks = pending.split("\n\n");
    pending = chunks.pop() || "";

    for (const chunk of chunks) {
      const event = parseSseChunk(chunk);
      if (!event) continue;

      if (event.name === "activity") {
        addActivity(event.data);
      }

      if (event.name === "result") {
        finalResult = event.data;
      }

      if (event.name === "error") {
        throw new Error(apiErrorMessage(event.data, "Failed to generate itinerary"));
      }
    }
  }

  if (!finalResult) {
    throw new Error("Planning stream ended without itinerary result.");
  }

  return finalResult;
}

function parseSseChunk(chunk) {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  let name = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      name = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  const raw = dataLines.join("\n");
  let data = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { message: raw };
  }

  return { name, data };
}

function resetTimeline() {
  dagViewSection.classList.remove("hidden");
  activitySection.classList.remove("hidden");
  activityEvents = [];
  toolMonitorSection.classList.remove("hidden");
  toolMonitorEvents = [];
  renderDagView();
  renderActivityTimeline();
  renderToolMonitorTimeline();
}

function addActivity(eventData) {
  const event = eventData ?? {};
  const eventType = event.type || "activity";
  activityEvents.push(event);
  renderDagView();
  renderActivityTimeline();

  if (TOOL_MONITOR_TYPES.has(eventType)) {
    toolMonitorEvents.push(event);
    renderToolMonitorTimeline();
  }
}

function renderDagView() {
  dagCanvas.innerHTML = "";
  const graph = buildDagGraph(activityEvents);
  if (!graph.nodes.length) {
    dagCanvas.innerHTML = '<p class="muted">DAG will appear as soon as events stream in.</p>';
    return;
  }

  const canvasWidth = Math.max(680, dagCanvas.clientWidth || 0);
  const horizontalPadding = 12;
  const columnGap = 20;
  const minNodeWidth = 150;
  const computedNodeWidth = Math.floor((canvasWidth - horizontalPadding * 2 - columnGap * 2) / 3);
  const nodeWidth = Math.max(minNodeWidth, computedNodeWidth);
  const svgWidth = horizontalPadding * 2 + nodeWidth * 3 + columnGap * 2;
  const columnX = [
    horizontalPadding,
    horizontalPadding + nodeWidth + columnGap,
    horizontalPadding + (nodeWidth + columnGap) * 2
  ];
  const nodeHeight = 56;
  const yGap = 18;
  const topPadding = 62;
  const colCount = 3;
  const rowCount = Math.max(
    1,
    ...Array.from({ length: colCount }, (_, index) => graph.nodes.filter((node) => node.column === index).length)
  );
  const svgHeight = topPadding + rowCount * (nodeHeight + yGap) + 30;

  const nodesByColumn = [[], [], []];
  for (const node of graph.nodes) {
    nodesByColumn[node.column].push(node);
  }
  for (const nodes of nodesByColumn) {
    nodes.sort((a, b) => a.order - b.order);
  }

  const positionedNodes = new Map();
  for (let column = 0; column < colCount; column += 1) {
    nodesByColumn[column].forEach((node, rowIndex) => {
      positionedNodes.set(node.id, {
        ...node,
        x: columnX[column],
        y: topPadding + rowIndex * (nodeHeight + yGap),
        width: nodeWidth,
        height: nodeHeight
      });
    });
  }

  const headerLabelByColumn = ["Stage", "Agent", "Tool"];
  const headerHtml = headerLabelByColumn
    .map((label, index) => {
      const x = columnX[index] + nodeWidth / 2;
      return `<text x="${x}" y="34" text-anchor="middle" class="dag-header">${escapeHtml(label)}</text>`;
    })
    .join("");

  const edgeHtml = graph.edges
    .map((edge) => {
      const fromNode = positionedNodes.get(edge.from);
      const toNode = positionedNodes.get(edge.to);
      if (!fromNode || !toNode) return "";
      const x1 = fromNode.x + fromNode.width;
      const y1 = fromNode.y + fromNode.height / 2;
      const x2 = toNode.x;
      const y2 = toNode.y + toNode.height / 2;
      const bend = (x1 + x2) / 2;
      return `<path class="dag-edge" d="M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}" />`;
    })
    .join("");

  const nodeHtml = Array.from(positionedNodes.values())
    .map((node) => {
      const textX = node.x + 12;
      const textY = node.y + node.height / 2 + 1;
      const label = formatDagLabel(node.label);
      return `
        <rect class="dag-node dag-node-${node.kind}" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="8" />
        <title>${escapeHtml(node.label)}</title>
        <text x="${textX}" y="${textY}" class="dag-node-text">${escapeHtml(label)}</text>
      `;
    })
    .join("");

  dagCanvas.innerHTML = `
    <svg class="dag-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMinYMin meet" aria-label="Execution DAG">
      <defs>
        <marker id="dag-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <path d="M 0 0 L 10 4 L 0 8 z" class="dag-arrowhead"></path>
        </marker>
      </defs>
      ${headerHtml}
      ${edgeHtml}
      ${nodeHtml}
    </svg>
  `;
}

function formatDagLabel(label) {
  const value = String(label || "");
  if (value.length <= 20) return value;
  return `${value.slice(0, 17)}...`;
}

function buildDagGraph(events) {
  const nodes = [];
  const edges = [];
  const edgeKeys = new Set();
  const stageNodeByName = new Map();
  const agentNodeByName = new Map();
  const toolNodeByName = new Map();
  const stageOrder = [];

  const addNode = (id, label, column, kind, order) => {
    const node = { id, label, column, kind, order };
    nodes.push(node);
    return node;
  };

  const addEdge = (from, to) => {
    if (!from || !to) return;
    const edgeKey = `${from}->${to}`;
    if (edgeKeys.has(edgeKey)) return;
    edgeKeys.add(edgeKey);
    edges.push({ from, to });
  };

  for (const event of events) {
    const stageName = String(event.stage || "general");
    if (!stageNodeByName.has(stageName)) {
      stageOrder.push(stageName);
      stageNodeByName.set(stageName, addNode(`stage:${stageName}`, stageName, 0, "stage", stageOrder.length - 1));
    }
  }

  for (let index = 0; index < stageOrder.length - 1; index += 1) {
    const current = stageNodeByName.get(stageOrder[index]);
    const next = stageNodeByName.get(stageOrder[index + 1]);
    addEdge(current?.id, next?.id);
  }

  for (const event of events) {
    const stageName = String(event.stage || "general");
    const stageNode = stageNodeByName.get(stageName);
    const agentName = event.agent ? String(event.agent) : "";

    let agentNode = null;
    if (agentName) {
      if (!agentNodeByName.has(agentName)) {
        const order = agentNodeByName.size;
        agentNodeByName.set(agentName, addNode(`agent:${agentName}`, agentName, 1, "agent", order));
      }
      agentNode = agentNodeByName.get(agentName);
      addEdge(stageNode?.id, agentNode?.id);
    }

    const isToolEvent = TOOL_MONITOR_TYPES.has(String(event.type || "")) || Boolean(event.toolName);
    if (isToolEvent) {
      const rawToolName = event.toolName || event.type || "tool";
      const toolName = String(rawToolName);
      if (!toolNodeByName.has(toolName)) {
        const order = toolNodeByName.size;
        toolNodeByName.set(toolName, addNode(`tool:${toolName}`, toolName, 2, "tool", order));
      }
      const toolNode = toolNodeByName.get(toolName);
      if (agentNode) {
        addEdge(agentNode.id, toolNode?.id);
      } else {
        addEdge(stageNode?.id, toolNode?.id);
      }
    }
  }

  return { nodes, edges };
}

function renderActivityTimeline() {
  renderCollapsibleList(activityList, activityEvents, buildActivityItem, {
    limit: TIMELINE_VISIBLE_LIMIT,
    label: "activity events"
  });
}

function renderToolMonitorTimeline() {
  renderCollapsibleList(toolMonitorList, toolMonitorEvents, buildToolMonitorItem, {
    limit: TIMELINE_VISIBLE_LIMIT,
    label: "tool events"
  });
}

function renderCollapsibleList(root, items, renderItem, options) {
  const limit = options?.limit ?? 3;
  const label = options?.label ?? "events";
  root.innerHTML = "";

  if (!items.length) {
    return;
  }

  const recentItems = items.slice(-limit).reverse();
  const remainingItems = items.slice(0, -limit).reverse();

  for (const event of recentItems) {
    root.appendChild(renderItem(event));
  }

  if (!remainingItems.length) {
    return;
  }

  const collapsible = document.createElement("li");
  collapsible.className = "timeline-collapsible";
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = `Show ${remainingItems.length} more ${label}`;
  details.appendChild(summary);

  const nestedList = document.createElement("ul");
  nestedList.className = "timeline-nested-list";
  for (const event of remainingItems) {
    nestedList.appendChild(renderItem(event));
  }
  details.appendChild(nestedList);
  collapsible.appendChild(details);
  root.appendChild(collapsible);
}

function buildActivityItem(event) {
  const eventType = event.type || "activity";
  const title = event.agent
    ? `[${eventType}] ${event.agent}: ${event.message || "Update"}`
    : `[${eventType}] ${event.message || "Update"}`;

  const item = document.createElement("li");
  item.className = "activity-item";

  const time = formatEventTime(event.timestamp);
  const summary = event.summary ? `<div class="activity-summary">${escapeHtml(JSON.stringify(event.summary))}</div>` : "";
  const safeDetails = [
    renderDetailBlock("Tool Source", event.source),
    renderDetailBlock("Tool Family", event.toolFamily),
    renderDetailBlock("Tool Phase", event.phase),
    renderDetailBlock("Status", event.status),
    renderDetailBlock("Trace ID", event.traceId)
  ]
    .filter(Boolean)
    .join("");

  const debugDetails = [
    renderDetailBlock("Prompt", event.prompt),
    renderDetailBlock("Response", event.response),
    renderDetailBlock("Tool Arguments", event.arguments),
    renderDetailBlock("Tool Output", event.output),
    renderDetailBlock("Raw LLM Run Item", event.rawItem),
    renderDetailBlock("Full Event JSON", safeStringify(event))
  ]
    .filter(Boolean)
    .join("");
  const statusMeta = getStatusMeta(event.status);

  item.innerHTML = `
    <div class="event-status-row">
      <span class="status-pill ${statusMeta.className}">${escapeHtml(statusMeta.label)}</span>
    </div>
    <div class="activity-time">${escapeHtml(time)} • ${escapeHtml(event.stage || "general")}</div>
    <div>${escapeHtml(title)}</div>
    ${summary}
    ${safeDetails}
    ${DEBUG_MODE ? debugDetails : ""}
  `;

  return item;
}

function buildToolMonitorItem(event) {
  const item = document.createElement("li");
  item.className = "activity-item";

  const time = formatEventTime(event.timestamp);
  const title = `[${event.type || "tool"}] ${event.toolName || "unknown_tool"}`;

  const details = [
    renderDetailBlock("Agent", event.agent),
    renderDetailBlock("Stage", event.stage),
    renderDetailBlock("Status", event.status),
    renderDetailBlock("Trace ID", event.traceId),
    renderDetailBlock("Source", event.source),
    renderDetailBlock("Family", event.toolFamily),
    renderDetailBlock("Phase", event.phase),
    DEBUG_MODE ? renderDetailBlock("Arguments", event.arguments) : "",
    DEBUG_MODE ? renderDetailBlock("Output", event.output) : "",
    DEBUG_MODE ? renderDetailBlock("Raw Item", event.rawItem) : "",
    DEBUG_MODE ? renderDetailBlock("Full Event JSON", safeStringify(event)) : ""
  ]
    .filter(Boolean)
    .join("");
  const statusMeta = getStatusMeta(event.status);

  item.innerHTML = `
    <div class="event-status-row">
      <span class="status-pill ${statusMeta.className}">${escapeHtml(statusMeta.label)}</span>
    </div>
    <div class="activity-time">${escapeHtml(time)}</div>
    <div>${escapeHtml(title)}</div>
    ${details}
  `;

  return item;
}

function formatEventTime(timestamp) {
  if (!timestamp) {
    return new Date().toLocaleTimeString();
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleTimeString();
  }

  return parsed.toLocaleTimeString();
}

function getStatusMeta(status) {
  const normalized = String(status || "info").toLowerCase();

  if (normalized === "completed" || normalized === "approved" || normalized === "success") {
    return { label: normalized.toUpperCase(), className: "status-completed" };
  }

  if (normalized === "failed" || normalized === "error" || normalized === "rejected") {
    return { label: normalized.toUpperCase(), className: "status-failed" };
  }

  if (normalized === "started" || normalized === "running" || normalized === "pending") {
    return { label: normalized.toUpperCase(), className: "status-started" };
  }

  return { label: normalized.toUpperCase(), className: "status-info" };
}

function renderDetailBlock(label, value) {
  if (!value) return "";
  return `<details><summary>${escapeHtml(label)}</summary><pre>${escapeHtml(String(value))}</pre></details>`;
}

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formToPayload(formData) {
  return {
    startCity: String(formData.get("startCity") || "").trim(),
    destinationCity: String(formData.get("destinationCity") || "").trim(),
    startDate: String(formData.get("startDate") || "").trim(),
    endDate: String(formData.get("endDate") || "").trim(),
    tripLengthDays: Number(formData.get("tripLengthDays")),
    activities: String(formData.get("activities") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    weatherPreferences: String(formData.get("weatherPreferences") || "").trim(),
    airTravelClass: String(formData.get("airTravelClass") || "economy"),
    hotelStars: String(formData.get("hotelStars") || "3"),
    transportationNotes: String(formData.get("transportationNotes") || "").trim() || undefined
  };
}

function setMessage(message, isError = false) {
  messagesSection.classList.remove("hidden");
  messagesSection.innerHTML = `<p class="${isError ? "" : "muted"}">${escapeHtml(message)}</p>`;
}

function renderItinerary(planData) {
  const itinerary = planData.itinerary;
  itinerarySection.classList.remove("hidden");

  itinerarySection.innerHTML = `
    <h2>Itinerary Draft</h2>
    <p>${escapeHtml(itinerary.tripSummary)}</p>
    <p class="muted">${escapeHtml(itinerary.disclaimer || "")}</p>
    <div id="components"></div>
    <h3>Activities</h3>
    ${renderActivityList(itinerary.activities || [])}
    <h3>Safety Concerns</h3>
    ${renderSimpleList(itinerary.safetyConcerns || [])}
    <h3>Packing List</h3>
    ${renderSimpleList(itinerary.packingList || [])}
    <h3>Estimated Cost Summary (USD)</h3>
    ${renderCostSummary(itinerary.estimatedCostSummary || {})}
    <div id="final-review"></div>
  `;

  const componentsRoot = document.getElementById("components");
  ["flight", "hotel", "carRental"].forEach((componentType) => {
    const component = itinerary.components?.[componentType];
    if (!component) return;

    const block = document.createElement("section");
    block.className = "card";

    const optionsHtml = (component.options || [])
      .map(
        (option) => `
          <label class="option">
            <div class="inline">
              <input type="radio" name="${componentType}-option" value="${escapeHtml(option.id)}" ${
          option.id === component.recommendedOptionId ? "checked" : ""
        } />
              <strong>${escapeHtml(option.label || option.id)}</strong>
            </div>
            <div class="muted">${escapeHtml(option.notes || "")}</div>
            ${renderObjectFields(option, ["id", "label", "notes"])}
          </label>
        `
      )
      .join("");

    block.innerHTML = `
      <h3>${escapeHtml(componentType)}</h3>
      <p>${escapeHtml(component.confirmationQuestion || "Please confirm this option")}</p>
      <div class="component-options">${optionsHtml}</div>
      <button data-component="${componentType}" class="confirm-btn">Confirm ${escapeHtml(componentType)}</button>
    `;

    componentsRoot.appendChild(block);
  });

  attachConfirmHandlers(planData.itineraryId);
  maybeRenderFinalAction(planData);
}

function attachConfirmHandlers(itineraryId) {
  document.querySelectorAll(".confirm-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const componentType = button.getAttribute("data-component");
      const selectedRadio = document.querySelector(`input[name="${componentType}-option"]:checked`);
      if (!selectedRadio) {
        setMessage(`Select an option for ${componentType} first.`, true);
        return;
      }

      button.disabled = true;

      try {
        const response = await fetch("/api/confirm-component", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itineraryId,
            componentType,
            optionId: selectedRadio.value
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(apiErrorMessage(data, "Failed to confirm component"));
        }

        if (!data.nextComponentToConfirm) {
          setMessage("All components confirmed. Please review final summary.");
          maybeRenderFinalAction({ ...currentPlan, finalReview: data.finalReview });
        } else {
          setMessage(`Confirmed ${componentType}. Next: confirm ${data.nextComponentToConfirm}.`);
        }
      } catch (error) {
        button.disabled = false;
        setMessage(error.message || "Unexpected confirmation error", true);
      }
    });
  });
}

function maybeRenderFinalAction(planData) {
  const finalReviewRoot = document.getElementById("final-review");
  if (!finalReviewRoot) return;

  if (!planData.finalReview) {
    finalReviewRoot.innerHTML = "";
    return;
  }

  finalReviewRoot.innerHTML = `
    <h3>Final Review</h3>
    <p>${escapeHtml(planData.finalReview.finalSummary || "")}</p>
    <p><strong>${escapeHtml(planData.finalReview.finalConfirmationQuestion || "Confirm final itinerary?")}</strong></p>
    <p class="muted">${escapeHtml(planData.finalReview.purchaseReminder || "No purchases are made")}</p>
    <div class="inline">
      <button id="final-approve">Approve Final Itinerary</button>
      <button id="final-reject" class="secondary">Reject Final Itinerary</button>
    </div>
  `;

  const approveButton = document.getElementById("final-approve");
  const rejectButton = document.getElementById("final-reject");
  approveButton?.addEventListener("click", async () => {
    await submitFinalDecision(true);
  });
  rejectButton?.addEventListener("click", async () => {
    await submitFinalDecision(false);
  });
}

async function submitFinalDecision(approved) {
  try {
    const response = await fetch("/api/final-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itineraryId: currentPlan.itineraryId, approved })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(apiErrorMessage(data, "Final confirmation failed"));
    }
    setMessage(data.message);
  } catch (error) {
    setMessage(error.message || "Unexpected final confirmation error", true);
  }
}

function renderSimpleList(items) {
  if (!items.length) return "<p class=\"muted\">No items.</p>";
  return `<ul class=\"list\">${items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
}

function renderActivityList(items) {
  if (!items.length) return "<p class=\"muted\">No activities.</p>";
  const rows = items
    .map((activity) => {
      const line = `${activity.scheduledDay || "Day"}: ${activity.name || "Activity"} ($${activity.estimatedCostUsd || 0})`;
      return `<li>${escapeHtml(line)}</li>`;
    })
    .join("");
  return `<ul class=\"list\">${rows}</ul>`;
}

function renderCostSummary(summary) {
  const entries = Object.entries(summary || {});
  if (!entries.length) {
    return '<p class="muted">No cost summary available.</p>';
  }

  const rows = entries
    .map(([key, value]) => {
      const isNumber = typeof value === "number" && Number.isFinite(value);
      const formattedValue = isNumber ? formatUsd(value) : String(value);
      return `
        <div class="kv-row">
          <span class="kv-key">${escapeHtml(humanizeKey(key))}</span>
          <span class="kv-value">${escapeHtml(formattedValue)}</span>
        </div>
      `;
    })
    .join("");

  return `<div class="kv-grid">${rows}</div>`;
}

function renderObjectFields(obj, skipKeys = []) {
  const skip = new Set(skipKeys);
  const entries = Object.entries(obj || {}).filter(([key]) => !skip.has(key));
  if (!entries.length) {
    return "";
  }

  const rows = entries
    .map(([key, value]) => {
      const formatted = formatFieldValue(value);
      return `
        <div class="kv-row">
          <span class="kv-key">${escapeHtml(humanizeKey(key))}</span>
          <span class="kv-value">${escapeHtml(formatted)}</span>
        </div>
      `;
    })
    .join("");

  return `<div class="kv-grid">${rows}</div>`;
}

function formatFieldValue(value) {
  if (value == null) return "-";
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 100 ? formatUsd(value) : String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function humanizeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function apiErrorMessage(data, fallback) {
  if (!data) return fallback;
  const parts = [data.error, data.details].filter(Boolean);
  return parts.length ? parts.join(": ") : fallback;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
