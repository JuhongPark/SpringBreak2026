# Assumption Register - Cycle 15

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | `costUsd` should remain highest-priority source | fallback overrides explicit total | unit test for explicit precedence | Engineering |
| 2 | Hotel fallback formula is `nightlyUsd * nights` | hotel total mismatch | formula test | Engineering |
| 3 | Car fallback formula is `dailyRateUsd * rentalDays` | car total mismatch | formula test | Engineering |
| 4 | Invalid/missing fields should not throw | runtime exception in calculation | invalid payload test | Engineering |
| 5 | Refactor should not affect unrelated planning logic | planning regressions | full test suite | Engineering |
