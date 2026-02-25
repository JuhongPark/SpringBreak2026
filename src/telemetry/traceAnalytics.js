export function summarizeTrace(events = []) {
  const sorted = sortEvents(events);

  const typeCounts = {};
  const statusCounts = {};
  let failedCount = 0;

  for (const event of sorted) {
    const type = event?.type || "unknown";
    const status = event?.status || "unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (status === "failed" || String(type).endsWith("_failed")) {
      failedCount += 1;
    }
  }

  const firstTs = sorted[0]?.timestamp ? Date.parse(sorted[0].timestamp) : null;
  const lastTs = sorted[sorted.length - 1]?.timestamp ? Date.parse(sorted[sorted.length - 1].timestamp) : null;
  const durationMs = Number.isFinite(firstTs) && Number.isFinite(lastTs) ? Math.max(0, lastTs - firstTs) : null;

  return {
    totalEvents: sorted.length,
    failedEvents: failedCount,
    hasFailures: failedCount > 0,
    typeCounts,
    statusCounts,
    durationMs
  };
}

export function buildTraceReport(events = []) {
  const sorted = sortEvents(events);
  const summary = summarizeTrace(sorted);
  const stageDurationsMs = buildStageDurations(sorted);
  const failedEventTypes = Array.from(
    new Set(
      sorted
        .filter((event) => event?.status === "failed" || String(event?.type || "").endsWith("_failed"))
        .map((event) => event?.type || "unknown")
    )
  );

  return {
    summary,
    stageDurationsMs,
    failedEventTypes,
    firstEvent: pickEventSnapshot(sorted[0]),
    lastEvent: pickEventSnapshot(sorted[sorted.length - 1]),
    criticalEvents: sorted
      .filter((event) =>
        ["planning_failed", "tool_call_failed", "fallback_triggered", "retry_started", "final_confirmation_received"].includes(
          event?.type
        )
      )
      .map((event) => pickEventSnapshot(event))
  };
}

function sortEvents(events = []) {
  const safeEvents = Array.isArray(events) ? events : [];
  return [...safeEvents].sort((a, b) => {
    const at = Date.parse(a?.timestamp || 0);
    const bt = Date.parse(b?.timestamp || 0);
    return at - bt;
  });
}

function buildStageDurations(sorted = []) {
  const stageWindow = new Map();
  for (const event of sorted) {
    const stage = event?.stage || "general";
    const ts = Date.parse(event?.timestamp || "");
    if (!Number.isFinite(ts)) continue;
    const current = stageWindow.get(stage) || { first: ts, last: ts };
    current.first = Math.min(current.first, ts);
    current.last = Math.max(current.last, ts);
    stageWindow.set(stage, current);
  }

  return Object.fromEntries(
    [...stageWindow.entries()].map(([stage, window]) => [stage, Math.max(0, window.last - window.first)])
  );
}

function pickEventSnapshot(event) {
  if (!event) return null;
  return {
    timestamp: event.timestamp ?? null,
    type: event.type ?? null,
    stage: event.stage ?? null,
    status: event.status ?? null,
    agent: event.agent ?? null,
    message: event.message ?? null
  };
}
