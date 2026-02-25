# Best Ideas Mapping - Cycle 4 (2026-02-25)

1. Multi-layer diagnostics
- Implemented: `/api/traces/:traceId/report` returning summary + stage durations + critical events.

2. Failure hotspot visibility
- Implemented: failed event types and critical event extraction.

3. Keep replay as source of truth
- Preserved: existing `/api/traces/:traceId` raw event endpoint unchanged.
