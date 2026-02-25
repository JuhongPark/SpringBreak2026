import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { createTraceStore } from "../src/telemetry/traceStore.js";

test("trace store appends and reads events by traceId", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "trace-store-"));
  const store = createTraceStore({ baseDir: dir, retentionDays: 7 });
  await store.init();

  const event = {
    traceId: "trace-a",
    timestamp: new Date().toISOString(),
    stage: "test",
    status: "completed",
    type: "planning_completed"
  };
  await store.append(event);
  const events = await store.read("trace-a");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "planning_completed");
});

test("trace retention cleanup removes expired jsonl files", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "trace-retention-"));
  const store = createTraceStore({ baseDir: dir, retentionDays: 1 });
  await store.init();

  const staleFile = store.traceFilePath("old-trace");
  await writeFile(staleFile, "{\"traceId\":\"old-trace\"}\n", "utf8");

  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const fakeNow = Date.now() + twoDaysMs;
  await store.cleanupOldTraces(fakeNow);

  await assert.rejects(() => store.read("old-trace"));
});
