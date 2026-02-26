# Assumption Register - Cycle 21

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Positive fractional counts should contribute at least one unit cost | lodging/rental shown as $0 for positive fractional count | boundary tests | Engineering |
| 2 | Exact zero should remain representable | zero input unexpectedly charged | zero-case inspection | Engineering |
| 3 | Frontend/backend parity is required for trust in totals | UI/API totals diverge near boundary values | parity code review + checks | Engineering |
| 4 | Boundary change should not regress prior rounding cases | existing fractional tests fail | full suite run | Engineering |
| 5 | Minimum-1 policy is acceptable for planning estimates | reviewer policy disagreement | next-cycle feedback | Engineering |
