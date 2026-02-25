# Assumption Register - Cycle 2

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | 429/5xx/timeout are transient in our flow | retries never trigger | unit tests by code/status | Engineering |
| 2 | 4xx non-rate-limit should not retry | noisy retries on 400 | unit tests for 400 cases | Engineering |
| 3 | Retention cleanup should not delete fresh traces | recent traces missing | append/read tests around cleanup | Engineering |
| 4 | Old traces should be removed automatically | stale files keep growing | retention cleanup test | Engineering |
| 5 | Server integration keeps replay endpoint behavior | replay endpoint regression | manual endpoint smoke check | Engineering |
| 6 | Observability remains intact after storage refactor | missing trace events | runtime stream + replay check | Engineering |
| 7 | Existing UI works with same payload shape | timeline rendering errors | manual UI smoke check | Engineering |
| 8 | Tests are fast enough for repeated gate checks | long CI runtime | local repeated run timings | Engineering |
| 9 | LOG_RETENTION_DAYS is safe default at 7 days | aggressive or infinite storage | env default inspection | Engineering |
|10| Cleanup on startup is sufficient for this stage | stale growth between restarts | known limitation documented | Engineering |
