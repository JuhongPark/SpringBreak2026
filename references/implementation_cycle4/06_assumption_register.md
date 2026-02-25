# Assumption Register - Cycle 4

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Stage durations can be approximated by first/last event per stage | implausible durations | unit tests with fixed timestamps | Engineering |
| 2 | Critical events list helps triage | operators ignore report output | next-cycle user feedback | Engineering |
| 3 | Report endpoint should not affect replay endpoint | regression in `/api/traces/:traceId` | endpoint smoke + tests | Engineering |
| 4 | Failure types can be inferred from status/type fields | missing failure markers | failed-trace unit test | Engineering |
| 5 | Empty trace should not crash report logic | 500 errors on sparse traces | empty-input tests | Engineering |
| 6 | Report size remains manageable | oversized payload on long traces | future load check | Engineering |
| 7 | Summary + report schema is stable enough for tooling | frequent schema changes | doc contract review | Engineering |
| 8 | Critical event filters cover top triage actions | misses important incidents | next-cycle event catalog review | Engineering |
| 9 | Sorting by timestamp is sufficient ordering strategy | ambiguous order on equal timestamps | deterministic test inputs | Engineering |
|10| Existing trace persistence format supports report generation | missing fields in stored events | runtime smoke with generated trace | Engineering |
