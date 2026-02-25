# Success Criteria (2026-02-25)

## Observability
- 100% planning sessions produce a `traceId`.
- Required event families are emitted: planning, model, tool, fallback/retry, confirmation.
- Replay endpoint returns full event list by `traceId`.

## Reliability
- Transient failures are retried up to 2 attempts.
- Invalid JSON output triggers one repair pass.
- Low-confidence research triggers one broadened fallback pass.

## Safety
- Default timeline does not expose raw prompt/tool payloads.
- Debug payloads require explicit debug mode (`?debug=1`).

## UX/API consistency
- Final confirmation supports both approve and reject.

## Validation method
- Automated tests for failure policies.
- Syntax checks for modified runtime files.
- Manual run checklist using a sample planning request and trace replay call.
