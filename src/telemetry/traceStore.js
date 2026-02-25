import path from "path";
import { mkdir, appendFile, readFile, readdir, rm, stat } from "fs/promises";

export function createTraceStore({ baseDir, retentionDays = 7, logger = console } = {}) {
  const logsDir = path.resolve(baseDir);
  const safeRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 7;

  return {
    logsDir,
    retentionDays: safeRetentionDays,

    async init() {
      await mkdir(logsDir, { recursive: true });
    },

    async append(eventPayload) {
      if (!eventPayload?.traceId) return;
      try {
        await appendFile(this.traceFilePath(eventPayload.traceId), `${JSON.stringify(eventPayload)}\n`, "utf8");
      } catch (error) {
        logger.error("Failed to persist trace event", error);
      }
    },

    async read(traceId) {
      const content = await readFile(this.traceFilePath(traceId), "utf8");
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    },

    traceFilePath(traceId) {
      return path.join(logsDir, `${traceId}.jsonl`);
    },

    async cleanupOldTraces(nowMs = Date.now()) {
      const maxAgeMs = safeRetentionDays * 24 * 60 * 60 * 1000;
      const entries = await readdir(logsDir);
      for (const name of entries) {
        if (!name.endsWith(".jsonl")) continue;
        const filePath = path.join(logsDir, name);
        try {
          const info = await stat(filePath);
          if (nowMs - info.mtimeMs > maxAgeMs) {
            await rm(filePath, { force: true });
          }
        } catch (error) {
          logger.error("Failed while evaluating trace retention cleanup", error);
        }
      }
    }
  };
}
