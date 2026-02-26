# Market Research - Cycle 16 (2026-02-26)

## Focus
Numerical reliability for pricing rules in travel option aggregation.

## Sources reviewed
- Floating-point rounding caveats in JavaScript arithmetic: https://developer.mozilla.org/
- Financial-calculation testing patterns (round at final amount, not intermediate rates): https://martinfowler.com/

## Patterns extracted
1. Validate non-negative numeric constraints before calculation.
2. Round final USD amount at output boundary.
3. Keep fallback order deterministic and explicit.
4. Add direct unit tests for decimal and invalid payload edge cases.
