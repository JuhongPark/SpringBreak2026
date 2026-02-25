# Assumption Register - Cycle 3

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Summary must preserve deterministic counts | inconsistent totals | fixed-input unit test | Engineering |
| 2 | Duration should be based on event timestamps | negative/invalid duration | timestamp ordering test | Engineering |
| 3 | Failures should be visible quickly | hasFailures false on failed traces | failed-event test | Engineering |
| 4 | Missing timestamp should not crash summary | runtime exception | empty/malformed input test | Engineering |
| 5 | Endpoint should return 404 for unknown trace | misleading 200/500 | API path error handling review | Engineering |
| 6 | Endpoint should keep full replay endpoint intact | regression on `/api/traces/:traceId` | syntax + runtime review | Engineering |
| 7 | Aggregated view should reduce inspection time | operators still scan raw first | team feedback in next cycle | Engineering |
| 8 | Summary logic should be unit-testable independent of server | hard-to-test behavior | isolated utility module test | Engineering |
| 9 | Summary fields should be stable for dashboards | frequent schema churn | contract check in docs | Engineering |
|10| Event status/type fields are sufficient for first-pass diagnosis | unknown-only counts | monitor real traces next cycle | Engineering |
