# Market Research - Cycle 21 (2026-02-26)

## Focus
Robust normalization policy for quasi-discrete duration/count fields.

## Sources reviewed
- Numeric normalization and boundary handling guidance: https://developer.mozilla.org/
- Reliability heuristics for user-visible totals: https://martinfowler.com/

## Patterns extracted
1. Positive count-like inputs should not collapse to zero through rounding artifacts.
2. Boundary behavior (`0`, `0<x<1`, `>=1`) should be explicit in helper functions.
3. Regression tests should lock the boundary policy.
