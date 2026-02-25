import test from "node:test";
import assert from "node:assert/strict";
import { buildTraceReport, summarizeTrace } from "../src/telemetry/traceAnalytics.js";

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
});
