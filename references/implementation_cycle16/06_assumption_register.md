# Assumption Register - Cycle 16

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Negative numeric values should never produce negative totals | negative USD appears in summary | unit tests + UI check | Engineering |
| 2 | Rounding should happen at final USD boundary | cent-level mismatches across paths | decimal test assertions | Engineering |
| 3 | Frontend/backend parity reduces confusion | backend vs UI total mismatch | manual comparison scenario | Engineering |
| 4 | Existing behavior for valid explicit cost remains unchanged | regression in baseline totals | existing and new tests | Engineering |
| 5 | Added guards do not impact unrelated orchestration logic | broad suite regressions | `npm test` | Engineering |
