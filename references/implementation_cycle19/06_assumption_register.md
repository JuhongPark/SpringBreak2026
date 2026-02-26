# Assumption Register - Cycle 19

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Activity costs can contain invalid values from model output or upstream data | total includes bad values | unit test with invalid payloads | Engineering |
| 2 | Negative activity costs should be excluded, not subtracted | total reduced by negative activities | edge-case assertions | Engineering |
| 3 | Decimal activity costs should remain accurate after rounding | cent-level mismatch | decimal test assertions | Engineering |
| 4 | Frontend and backend must use the same activity inclusion rule | UI/API totals diverge | rule parity inspection | Engineering |
| 5 | Aggregation hardening should not regress existing flows | unrelated test failures | full suite run | Engineering |
