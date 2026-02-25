import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTraceInsights,
  buildTraceSnapshot,
  buildTraceReport,
  detectTraceAnomalies,
  evaluateTraceHealth,
  getAnomalyThresholdProfile,
  summarizeTrace
} from "../src/telemetry/traceAnalytics.js";

test("summarizeTrace returns counts and duration", () => {
  const events = [
    { timestamp: "2026-02-25T10:00:00.000Z", type: "planning_started", status: "started" },
    { timestamp: "2026-02-25T10:00:01.000Z", type: "tool_call_failed", status: "failed" },
    { timestamp: "2026-02-25T10:00:03.000Z", type: "planning_completed", status: "completed" }
  ];
  const summary = summarizeTrace(events);

  assert.equal(summary.totalEvents, 3);
  assert.equal(summary.failedEvents, 1);
  assert.equal(summary.hasFailures, true);
  assert.equal(summary.typeCounts.planning_started, 1);
  assert.equal(summary.typeCounts.tool_call_failed, 1);
  assert.equal(summary.statusCounts.completed, 1);
  assert.equal(summary.durationMs, 3000);
});

test("summarizeTrace handles empty input", () => {
  const summary = summarizeTrace([]);
  assert.equal(summary.totalEvents, 0);
  assert.equal(summary.hasFailures, false);
  assert.equal(summary.durationMs, null);
});

test("buildTraceReport computes stage durations and critical events", () => {
  const events = [
    {
      timestamp: "2026-02-25T10:00:00.000Z",
      type: "planning_started",
      stage: "initialization",
      status: "started",
      message: "start"
    },
    {
      timestamp: "2026-02-25T10:00:01.000Z",
      type: "retry_started",
      stage: "research",
      status: "retrying",
      message: "retry"
    },
    {
      timestamp: "2026-02-25T10:00:02.000Z",
      type: "tool_call_failed",
      stage: "research",
      status: "failed",
      message: "tool failed"
    },
    {
      timestamp: "2026-02-25T10:00:05.000Z",
      type: "planning_completed",
      stage: "finalization",
      status: "completed",
      message: "done"
    }
  ];

  const report = buildTraceReport(events);
  assert.equal(report.summary.totalEvents, 4);
  assert.equal(report.summary.failedEvents, 1);
  assert.equal(report.stageDurationsMs.research, 1000);
  assert.equal(report.firstEvent.type, "planning_started");
  assert.equal(report.lastEvent.type, "planning_completed");
  assert.ok(report.failedEventTypes.includes("tool_call_failed"));
  assert.ok(report.criticalEvents.some((event) => event.type === "retry_started"));
  assert.equal(report.retryCount, 1);
  assert.equal(report.fallbackCount, 0);
  assert.equal(report.stageBreakdown.research.eventCount, 2);
  assert.equal(report.stageBreakdown.research.failedEventCount, 1);
  assert.equal(report.stageBreakdown.research.statusCounts.retrying, 1);
  assert.equal(report.stageBreakdown.research.statusCounts.failed, 1);
});

test("detectTraceAnomalies flags retries, failures, and long stages", () => {
  const report = {
    summary: {
      durationMs: 200000,
      failedEvents: 2
    },
    stageDurationsMs: {
      research: 120000
    },
    retryCount: 3,
    fallbackCount: 2
  };

  const result = detectTraceAnomalies(report, {
    maxDurationMs: 180000,
    maxStageDurationMs: 90000,
    maxRetries: 2,
    maxFallbacks: 1,
    maxFailures: 0
  });

  assert.equal(result.hasAnomalies, true);
  assert.ok(result.anomalies.some((item) => item.code === "TRACE_DURATION_HIGH"));
  assert.ok(result.anomalies.some((item) => item.code === "STAGE_DURATION_HIGH"));
  assert.ok(result.anomalies.some((item) => item.code === "RETRY_COUNT_HIGH"));
  assert.ok(result.anomalies.some((item) => item.code === "FALLBACK_COUNT_HIGH"));
  assert.ok(result.anomalies.some((item) => item.code === "FAILED_EVENTS_PRESENT"));
  assert.equal(result.severityCounts.warning, 4);
  assert.equal(result.severityCounts.critical, 1);
  assert.ok(result.recommendedActions.length >= 1);
});

test("detectTraceAnomalies respects threshold overrides", () => {
  const report = {
    summary: {
      durationMs: 1000,
      failedEvents: 0
    },
    stageDurationsMs: {
      research: 500
    },
    retryCount: 1,
    fallbackCount: 0
  };

  const strict = detectTraceAnomalies(report, {
    maxDurationMs: 10,
    maxStageDurationMs: 10,
    maxRetries: 0,
    maxFallbacks: 0,
    maxFailures: 0
  });

  assert.equal(strict.hasAnomalies, true);
  assert.ok(strict.anomalies.some((item) => item.code === "TRACE_DURATION_HIGH"));
  assert.ok(strict.anomalies.some((item) => item.code === "STAGE_DURATION_HIGH"));
  assert.ok(strict.anomalies.some((item) => item.code === "RETRY_COUNT_HIGH"));
});

test("getAnomalyThresholdProfile returns strict and default profiles", () => {
  const strict = getAnomalyThresholdProfile("strict");
  const unknown = getAnomalyThresholdProfile("not-real");
  assert.equal(strict.maxRetries, 1);
  assert.equal(unknown.maxRetries, 2);
});

test("detectTraceAnomalies includes actionable recommendations for failures", () => {
  const report = {
    summary: { durationMs: 1000, failedEvents: 1 },
    stageDurationsMs: {},
    retryCount: 0,
    fallbackCount: 0
  };
  const result = detectTraceAnomalies(report, { maxFailures: 0 });
  assert.equal(result.hasAnomalies, true);
  assert.ok(result.recommendedActions.some((text) => text.includes("failed events")));
});

test("evaluateTraceHealth maps anomaly severities to status and score", () => {
  const healthy = evaluateTraceHealth({
    severityCounts: {},
    anomalies: []
  });
  assert.equal(healthy.status, "healthy");
  assert.equal(healthy.score, 100);

  const degraded = evaluateTraceHealth({
    severityCounts: { warning: 2 },
    anomalies: [{ code: "A", severity: "warning", message: "warn" }]
  });
  assert.equal(degraded.status, "degraded");
  assert.equal(degraded.score, 80);

  const critical = evaluateTraceHealth({
    severityCounts: { warning: 1, critical: 1 },
    anomalies: [{ code: "B", severity: "critical", message: "crit" }]
  });
  assert.equal(critical.status, "critical");
  assert.equal(critical.score, 40);
});

test("buildTraceSnapshot returns compact operational view", () => {
  const report = {
    summary: { failedEvents: 1, totalEvents: 10, durationMs: 5000 },
    retryCount: 2,
    fallbackCount: 1
  };
  const anomalies = {
    anomalies: [{ code: "FAILED_EVENTS_PRESENT", severity: "critical", message: "failed events" }],
    recommendedActions: ["Inspect failures first."]
  };
  const health = { status: "critical", score: 40 };

  const snapshot = buildTraceSnapshot(report, anomalies, health);
  assert.equal(snapshot.status, "critical");
  assert.equal(snapshot.score, 40);
  assert.equal(snapshot.retryCount, 2);
  assert.equal(snapshot.fallbackCount, 1);
  assert.equal(snapshot.failedEvents, 1);
  assert.equal(snapshot.topAnomaly.code, "FAILED_EVENTS_PRESENT");
  assert.ok(snapshot.recommendedActions.includes("Inspect failures first."));
});

test("buildTraceInsights returns bottleneck stage and failure rate", () => {
  const report = {
    summary: { totalEvents: 8, failedEvents: 2 },
    stageBreakdown: {
      research: { durationMs: 1200 },
      composition: { durationMs: 3000 }
    }
  };
  const anomalies = {
    anomalies: [
      { code: "FAILED_EVENTS_PRESENT", severity: "critical", message: "failed events found" },
      { code: "RETRY_COUNT_HIGH", severity: "warning", message: "retry high" }
    ]
  };
  const health = { status: "critical", score: 40 };

  const insights = buildTraceInsights(report, anomalies, health);
  assert.equal(insights.status, "critical");
  assert.equal(insights.score, 40);
  assert.equal(insights.failureRate, 0.25);
  assert.equal(insights.bottleneckStage.stage, "composition");
  assert.equal(insights.topIssues.length, 2);
});
