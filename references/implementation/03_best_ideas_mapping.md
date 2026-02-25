# Best Ideas Mapping (2026-02-25)

## Research idea -> Project implementation

1. Alert-style visibility for changing states
- Applied as: structured planning events with status and stage in SSE timeline.
- Evidence: `server.js` normalized trace events (`status`, `stage`, `traceId`).

2. Debuggability with replay
- Applied as: persisted trace logs + replay endpoint.
- Evidence: `GET /api/traces/:traceId`, JSONL trace store.

3. Transparent but safe user UX
- Applied as: default user-safe timeline; detailed payloads gated by `?debug=1`.
- Evidence: `public/app.js` debug gating.

4. Failure resilience
- Applied as: bounded retry for transient agent errors, JSON repair pass, low-confidence fallback.
- Evidence: `runAgentWithTelemetry`, `parseAgentJsonWithRepair`, low-confidence research fallback.

5. Explicit decision endpoints
- Applied as: final confirmation supports approve and reject flows in UI and API.
- Evidence: `public/app.js` approve/reject buttons, `/api/final-confirmation`.
