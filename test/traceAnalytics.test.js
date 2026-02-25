import test from "node:test";
import assert from "node:assert/strict";
import { summarizeTrace } from "../src/telemetry/traceAnalytics.js";

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
