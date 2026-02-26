# Assumption Register - Cycle 20

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Fractional counts should be treated as malformed-but-recoverable input | inconsistent totals for same input pattern | helper tests for fractional counts | Engineering |
| 2 | Rounding counts to nearest integer is acceptable for this planning scope | reviewer disagreement on rounding direction | product feedback next cycle | Engineering |
| 3 | Frontend/backend parity prevents visible pricing drift | UI total differs from backend summary | code parity review + manual check | Engineering |
| 4 | Integer normalization should not regress existing integer scenarios | baseline tests fail | full test suite | Engineering |
| 5 | Additional normalization logic should remain deterministic | flaky outputs across runs | repeated test runs | Engineering |
