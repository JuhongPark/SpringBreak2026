export const ANOMALY_THRESHOLD_PROFILES = {
  strict: {
    maxDurationMs: 120000,
    maxStageDurationMs: 60000,
    maxRetries: 1,
    maxFallbacks: 0,
    maxFailures: 0
  },
  default: {
    maxDurationMs: 180000,
    maxStageDurationMs: 90000,
    maxRetries: 2,
    maxFallbacks: 1,
    maxFailures: 0
  },
  lenient: {
    maxDurationMs: 300000,
    maxStageDurationMs: 180000,
    maxRetries: 4,
    maxFallbacks: 3,
    maxFailures: 1
  }
};

export function getAnomalyThresholdProfile(profileName = "default") {
  const normalized = String(profileName || "default").toLowerCase();
  return ANOMALY_THRESHOLD_PROFILES[normalized] || ANOMALY_THRESHOLD_PROFILES.default;
}

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
  const stageBreakdown = buildStageBreakdown(sorted);
  const retryCount = summary.typeCounts.retry_started ?? 0;
  const fallbackCount = summary.typeCounts.fallback_triggered ?? 0;
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
    stageBreakdown,
    retryCount,
    fallbackCount,
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

export function detectTraceAnomalies(report, thresholds = {}) {
  const safeReport = report ?? {};
  const summary = safeReport.summary ?? {};
  const stageDurations = safeReport.stageDurationsMs ?? {};
  const anomalies = [];

  const config = {
    maxDurationMs: thresholds.maxDurationMs ?? ANOMALY_THRESHOLD_PROFILES.default.maxDurationMs,
    maxStageDurationMs: thresholds.maxStageDurationMs ?? ANOMALY_THRESHOLD_PROFILES.default.maxStageDurationMs,
    maxRetries: thresholds.maxRetries ?? ANOMALY_THRESHOLD_PROFILES.default.maxRetries,
    maxFallbacks: thresholds.maxFallbacks ?? ANOMALY_THRESHOLD_PROFILES.default.maxFallbacks,
    maxFailures: thresholds.maxFailures ?? ANOMALY_THRESHOLD_PROFILES.default.maxFailures
  };

  if (Number(summary.durationMs) > config.maxDurationMs) {
    anomalies.push({
      code: "TRACE_DURATION_HIGH",
      severity: "warning",
      message: `Trace duration ${summary.durationMs}ms exceeded ${config.maxDurationMs}ms.`,
      meta: { durationMs: summary.durationMs, thresholdMs: config.maxDurationMs }
    });
  }

  for (const [stage, durationMs] of Object.entries(stageDurations)) {
    if (Number(durationMs) > config.maxStageDurationMs) {
      anomalies.push({
        code: "STAGE_DURATION_HIGH",
        severity: "warning",
        message: `Stage '${stage}' duration ${durationMs}ms exceeded ${config.maxStageDurationMs}ms.`,
        meta: { stage, durationMs, thresholdMs: config.maxStageDurationMs }
      });
    }
  }

  if ((safeReport.retryCount ?? 0) > config.maxRetries) {
    anomalies.push({
      code: "RETRY_COUNT_HIGH",
      severity: "warning",
      message: `Retry count ${(safeReport.retryCount ?? 0)} exceeded ${config.maxRetries}.`,
      meta: { retryCount: safeReport.retryCount ?? 0, threshold: config.maxRetries }
    });
  }

  if ((safeReport.fallbackCount ?? 0) > config.maxFallbacks) {
    anomalies.push({
      code: "FALLBACK_COUNT_HIGH",
      severity: "warning",
      message: `Fallback count ${(safeReport.fallbackCount ?? 0)} exceeded ${config.maxFallbacks}.`,
      meta: { fallbackCount: safeReport.fallbackCount ?? 0, threshold: config.maxFallbacks }
    });
  }

  if ((summary.failedEvents ?? 0) > config.maxFailures) {
    anomalies.push({
      code: "FAILED_EVENTS_PRESENT",
      severity: "critical",
      message: `Failed events ${(summary.failedEvents ?? 0)} exceeded ${config.maxFailures}.`,
      meta: { failedEvents: summary.failedEvents ?? 0, threshold: config.maxFailures }
    });
  }

  const severityCounts = anomalies.reduce(
    (acc, anomaly) => {
      const key = anomaly.severity || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
    severityCounts,
    recommendedActions: recommendActions(anomalies),
    thresholds: config
  };
}

export function evaluateTraceHealth(anomalyResult = {}) {
  const severityCounts = anomalyResult?.severityCounts ?? {};
  const critical = Number(severityCounts.critical || 0);
  const warning = Number(severityCounts.warning || 0);

  const score = Math.max(0, 100 - critical * 50 - warning * 10);
  const status = critical > 0 ? "critical" : warning > 0 ? "degraded" : "healthy";

  return {
    status,
    score,
    reasons: (anomalyResult?.anomalies ?? []).map((item) => ({
      code: item.code,
      severity: item.severity,
      message: item.message
    }))
  };
}

export function buildTraceSnapshot(report, anomalyResult, health) {
  const topAnomaly = (anomalyResult?.anomalies ?? [])[0] ?? null;
  return {
    status: health?.status ?? "unknown",
    score: health?.score ?? 0,
    summary: report?.summary ?? null,
    topAnomaly: topAnomaly
      ? {
          code: topAnomaly.code,
          severity: topAnomaly.severity,
          message: topAnomaly.message
        }
      : null,
    retryCount: report?.retryCount ?? 0,
    fallbackCount: report?.fallbackCount ?? 0,
    failedEvents: report?.summary?.failedEvents ?? 0,
    recommendedActions: anomalyResult?.recommendedActions ?? []
  };
}

export function buildTraceInsights(report, anomalyResult, health) {
  const safeReport = report ?? {};
  const summary = safeReport.summary ?? {};
  const stageBreakdown = safeReport.stageBreakdown ?? {};
  const anomalies = anomalyResult?.anomalies ?? [];

  const totalEvents = Number(summary.totalEvents || 0);
  const failedEvents = Number(summary.failedEvents || 0);
  const failureRate = totalEvents > 0 ? Number((failedEvents / totalEvents).toFixed(4)) : 0;

  let bottleneckStage = null;
  let maxDuration = -1;
  for (const [stage, details] of Object.entries(stageBreakdown)) {
    const durationMs = Number(details?.durationMs ?? -1);
    if (durationMs > maxDuration) {
      maxDuration = durationMs;
      bottleneckStage = { stage, durationMs };
    }
  }

  return {
    status: health?.status ?? "unknown",
    score: health?.score ?? 0,
    totalEvents,
    failedEvents,
    failureRate,
    bottleneckStage,
    anomalyCount: anomalies.length,
    topIssues: anomalies.slice(0, 3).map((item) => ({
      code: item.code,
      severity: item.severity,
      message: item.message
    }))
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

function buildStageBreakdown(sorted = []) {
  const stageMap = new Map();
  for (const event of sorted) {
    const stage = event?.stage || "general";
    const status = event?.status || "unknown";
    const ts = Date.parse(event?.timestamp || "");

    if (!stageMap.has(stage)) {
      stageMap.set(stage, {
        eventCount: 0,
        failedEventCount: 0,
        statusCounts: {},
        firstTs: Number.isFinite(ts) ? ts : null,
        lastTs: Number.isFinite(ts) ? ts : null
      });
    }

    const slot = stageMap.get(stage);
    slot.eventCount += 1;
    slot.statusCounts[status] = (slot.statusCounts[status] || 0) + 1;

    if (status === "failed" || String(event?.type || "").endsWith("_failed")) {
      slot.failedEventCount += 1;
    }

    if (Number.isFinite(ts)) {
      slot.firstTs = slot.firstTs == null ? ts : Math.min(slot.firstTs, ts);
      slot.lastTs = slot.lastTs == null ? ts : Math.max(slot.lastTs, ts);
    }
  }

  return Object.fromEntries(
    [...stageMap.entries()].map(([stage, slot]) => [
      stage,
      {
        eventCount: slot.eventCount,
        failedEventCount: slot.failedEventCount,
        statusCounts: slot.statusCounts,
        durationMs:
          slot.firstTs != null && slot.lastTs != null ? Math.max(0, slot.lastTs - slot.firstTs) : null
      }
    ])
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

function recommendActions(anomalies = []) {
  const actions = new Set();
  for (const anomaly of anomalies) {
    switch (anomaly?.code) {
      case "TRACE_DURATION_HIGH":
      case "STAGE_DURATION_HIGH":
        actions.add("Review long-running stages and inspect tool/model latency events.");
        break;
      case "RETRY_COUNT_HIGH":
        actions.add("Inspect transient failures and adjust retry/fallback strategy if needed.");
        break;
      case "FALLBACK_COUNT_HIGH":
        actions.add("Review research quality and broaden source/query strategy.");
        break;
      case "FAILED_EVENTS_PRESENT":
        actions.add("Prioritize failed events, inspect trace report critical events, and rerun with debug mode.");
        break;
      default:
        actions.add("Review trace report and raw events for root-cause analysis.");
        break;
    }
  }
  return Array.from(actions);
}
