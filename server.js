import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import {
  buildItineraryDraft,
  createFinalReview,
  validateTripRequest,
  TRIP_COMPONENTS
} from "./src/agents/tripPlanner.js";
import { isConfirmationConflict } from "./src/agents/failurePolicies.js";
import { createTraceStore } from "./src/telemetry/traceStore.js";
import {
  buildTraceInsights,
  buildTraceSnapshot,
  buildTraceReport,
  detectTraceAnomalies,
  evaluateTraceHealth,
  getAnomalyThresholdProfile,
  summarizeTrace
} from "./src/telemetry/traceAnalytics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const logsDir = path.join(__dirname, "data", "logs");
const traceStore = createTraceStore({ baseDir: logsDir });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const itineraryStore = new Map();
void traceStore.init();

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "spring-break-trip-agent" });
});

app.post("/api/plan", async (req, res) => {
  const validation = validateTripRequest(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid trip request",
      details: validation.error.flatten()
    });
  }

  try {
    const preferences = validation.data;
    const itineraryDraft = await buildItineraryDraft(preferences);
    const itineraryId = storeItineraryRecord(preferences, itineraryDraft);

    res.json({
      itineraryId,
      itinerary: itineraryDraft,
      nextComponentToConfirm: nextComponentToConfirm(itineraryStore.get(itineraryId).confirmations)
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate itinerary",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.post("/api/plan-stream", async (req, res) => {
  const validation = validateTripRequest(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid trip request",
      details: validation.error.flatten()
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  let responseClosed = false;
  res.on("close", () => {
    responseClosed = true;
  });
  req.on("aborted", () => {
    responseClosed = true;
  });

  const traceId = randomUUID();
  const pushEvent = (eventName, payload) => {
    if (responseClosed) return;
    const normalized = normalizeTraceEvent(traceId, payload);
    void traceStore.append(normalized);
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(normalized)}\n\n`);
  };

  try {
    const preferences = validation.data;
    pushEvent("activity", {
      type: "planning_started",
      stage: "initialization",
      status: "started",
      message: "Trip planning request accepted."
    });

    const itineraryDraft = await buildItineraryDraft(preferences, {
      onEvent: (event) => pushEvent("activity", event)
    });

    const itineraryId = storeItineraryRecord(preferences, itineraryDraft, traceId);
    pushEvent("result", {
      type: "planning_result",
      stage: "finalization",
      status: "completed",
      itineraryId,
      traceId,
      itinerary: itineraryDraft,
      nextComponentToConfirm: nextComponentToConfirm(itineraryStore.get(itineraryId).confirmations)
    });
    pushEvent("done", {
      type: "stream_done",
      stage: "finalization",
      status: "completed",
      message: "Planning complete. Review options and confirm components."
    });
  } catch (error) {
    pushEvent("error", {
      type: "planning_failed",
      stage: "finalization",
      status: "failed",
      error: "Failed to generate itinerary",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  } finally {
    if (!responseClosed) {
      res.end();
    }
  }
});

app.post("/api/confirm-component", async (req, res) => {
  const { itineraryId, componentType, optionId } = req.body ?? {};
  if (!itineraryId || !componentType || !optionId) {
    return res.status(400).json({ error: "itineraryId, componentType, and optionId are required" });
  }

  if (!TRIP_COMPONENTS.includes(componentType)) {
    return res.status(400).json({
      error: `componentType must be one of: ${TRIP_COMPONENTS.join(", ")}`
    });
  }

  const record = itineraryStore.get(itineraryId);
  if (!record) {
    return res.status(404).json({ error: "Itinerary not found" });
  }

  const component = record.itinerary?.components?.[componentType];
  if (!component) {
    return res.status(400).json({ error: `Component '${componentType}' is not available in itinerary` });
  }

  if (isConfirmationConflict(component.options, optionId)) {
    return res.status(400).json({ error: "Selected option is not valid for this component" });
  }

  record.confirmations[componentType] = {
    optionId,
    confirmedAt: new Date().toISOString()
  };

  const remainingComponent = nextComponentToConfirm(record.confirmations);
  if (!remainingComponent) {
    record.finalReview = await createFinalReview(record.preferences, record.itinerary, record.confirmations);
    await traceStore.append(
      normalizeTraceEvent(record.traceId, {
        type: "final_confirmation_requested",
        stage: "confirmation",
        status: "started",
        message: "All components confirmed. Waiting for final yes/no decision."
      })
    );
  }

  res.json({
    itineraryId,
    traceId: record.traceId,
    confirmations: record.confirmations,
    nextComponentToConfirm: remainingComponent,
    finalReview: record.finalReview ?? null
  });
});

app.post("/api/final-confirmation", (req, res) => {
  const { itineraryId, approved } = req.body ?? {};
  if (!itineraryId || typeof approved !== "boolean") {
    return res.status(400).json({ error: "itineraryId and approved(boolean) are required" });
  }

  const record = itineraryStore.get(itineraryId);
  if (!record) {
    return res.status(404).json({ error: "Itinerary not found" });
  }

  const stillPending = nextComponentToConfirm(record.confirmations);
  if (stillPending) {
    return res.status(400).json({
      error: `Please confirm ${stillPending} before final confirmation`
    });
  }

  record.finalConfirmed = approved;
  record.finalConfirmationAt = new Date().toISOString();
  void traceStore.append(
    normalizeTraceEvent(record.traceId, {
      type: "final_confirmation_received",
      stage: "confirmation",
      status: approved ? "approved" : "rejected",
      approved,
      message: approved ? "Final itinerary approved." : "Final itinerary rejected."
    })
  );

  res.json({
    itineraryId,
    approved,
    message: approved
      ? "Final itinerary confirmed. No purchases were made."
      : "Final itinerary was not approved. No purchases were made.",
    noPurchasePolicy: "At this stage, nothing is purchased."
  });
});

app.get("/api/traces/:traceId", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);

    res.json({ traceId, events });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to read trace",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/summary", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const summary = summarizeTrace(events);
    res.json({ traceId, summary });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to summarize trace",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/report", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const report = buildTraceReport(events);
    res.json({ traceId, report });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to build trace report",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/stage-breakdown", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const report = buildTraceReport(events);
    res.json({
      traceId,
      stageBreakdown: report.stageBreakdown,
      stageDurationsMs: report.stageDurationsMs
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to build stage breakdown",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/anomalies", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const report = buildTraceReport(events);
    const thresholdConfig = resolveAnomalyThresholds(req.query);
    const anomalies = detectTraceAnomalies(report, thresholdConfig.thresholds);
    res.json({
      traceId,
      profile: thresholdConfig.profile,
      thresholdOverridesApplied: thresholdConfig.overridesApplied,
      anomalies
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to detect trace anomalies",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/health", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const report = buildTraceReport(events);
    const thresholdConfig = resolveAnomalyThresholds(req.query);
    const anomalies = detectTraceAnomalies(report, thresholdConfig.thresholds);
    const health = evaluateTraceHealth(anomalies);
    res.json({
      traceId,
      profile: thresholdConfig.profile,
      thresholdOverridesApplied: thresholdConfig.overridesApplied,
      health
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to evaluate trace health",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/snapshot", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const report = buildTraceReport(events);
    const thresholdConfig = resolveAnomalyThresholds(req.query);
    const anomalies = detectTraceAnomalies(report, thresholdConfig.thresholds);
    const health = evaluateTraceHealth(anomalies);
    const snapshot = buildTraceSnapshot(report, anomalies, health);
    res.json({
      traceId,
      profile: thresholdConfig.profile,
      thresholdOverridesApplied: thresholdConfig.overridesApplied,
      snapshot
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to build trace snapshot",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/traces/:traceId/insights", async (req, res) => {
  const { traceId } = req.params;
  if (!traceId) {
    return res.status(400).json({ error: "traceId is required" });
  }

  try {
    const events = await traceStore.read(traceId);
    const report = buildTraceReport(events);
    const thresholdConfig = resolveAnomalyThresholds(req.query);
    const anomalies = detectTraceAnomalies(report, thresholdConfig.thresholds);
    const health = evaluateTraceHealth(anomalies);
    const insights = buildTraceInsights(report, anomalies, health);
    res.json({
      traceId,
      profile: thresholdConfig.profile,
      thresholdOverridesApplied: thresholdConfig.overridesApplied,
      insights
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ error: "Trace not found" });
    }
    res.status(500).json({
      error: "Failed to build trace insights",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.listen(port, () => {
  console.log(`Trip planner app listening on http://localhost:${port}`);
});

function nextComponentToConfirm(confirmations) {
  return TRIP_COMPONENTS.find((component) => !confirmations[component]) ?? null;
}

function storeItineraryRecord(preferences, itineraryDraft, traceId = null) {
  const itineraryId = randomUUID();
  itineraryStore.set(itineraryId, {
    itineraryId,
    traceId,
    preferences,
    itinerary: itineraryDraft,
    confirmations: {
      flight: null,
      hotel: null,
      carRental: null
    },
    finalConfirmed: false,
    createdAt: new Date().toISOString()
  });

  return itineraryId;
}

function normalizeTraceEvent(traceId, payload) {
  const status = payload?.status ?? inferStatus(payload?.type);
  return {
    timestamp: new Date().toISOString(),
    traceId,
    stage: payload?.stage ?? "general",
    agent: payload?.agent ?? null,
    status,
    ...payload
  };
}

function inferStatus(type) {
  if (!type) return "info";
  if (String(type).endsWith("_started") || type === "agent_invoked") return "started";
  if (String(type).endsWith("_completed")) return "completed";
  if (String(type).endsWith("_failed")) return "failed";
  return "info";
}

function parseAnomalyThresholds(query = {}) {
  return {
    maxDurationMs: toPositiveNumber(query.maxDurationMs),
    maxStageDurationMs: toPositiveNumber(query.maxStageDurationMs),
    maxRetries: toPositiveNumber(query.maxRetries),
    maxFallbacks: toPositiveNumber(query.maxFallbacks),
    maxFailures: toPositiveNumber(query.maxFailures)
  };
}

function resolveAnomalyThresholds(query = {}) {
  const profile = String(query.profile || "default").toLowerCase();
  const profileThresholds = getAnomalyThresholdProfile(profile);
  const overrides = parseAnomalyThresholds(query);
  const merged = {
    maxDurationMs: overrides.maxDurationMs ?? profileThresholds.maxDurationMs,
    maxStageDurationMs: overrides.maxStageDurationMs ?? profileThresholds.maxStageDurationMs,
    maxRetries: overrides.maxRetries ?? profileThresholds.maxRetries,
    maxFallbacks: overrides.maxFallbacks ?? profileThresholds.maxFallbacks,
    maxFailures: overrides.maxFailures ?? profileThresholds.maxFailures
  };

  const overridesApplied = Object.values(overrides).some((value) => typeof value !== "undefined");
  return { profile, thresholds: merged, overridesApplied };
}

function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
