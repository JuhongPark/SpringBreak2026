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
    maxDurationMs: thresholds.maxDurationMs ?? 180000,
    maxStageDurationMs: thresholds.maxStageDurationMs ?? 90000,
    maxRetries: thresholds.maxRetries ?? 2,
    maxFallbacks: thresholds.maxFallbacks ?? 1,
    maxFailures: thresholds.maxFailures ?? 0
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
