export function summarizeTrace(events = []) {
  const safeEvents = Array.isArray(events) ? events : [];
  const sorted = [...safeEvents].sort((a, b) => {
    const at = Date.parse(a?.timestamp || 0);
    const bt = Date.parse(b?.timestamp || 0);
    return at - bt;
  });

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
