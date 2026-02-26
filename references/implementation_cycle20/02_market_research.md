# Market Research - Cycle 20 (2026-02-26)

## Focus
Deterministic handling of fractional count fields in pricing calculations.

## Sources reviewed
- JavaScript numeric normalization practices: https://developer.mozilla.org/
- Practical reliability patterns for derived business values: https://martinfowler.com/

## Patterns extracted
1. Count-like fields should be normalized to integers before arithmetic.
2. Normalization rules must be explicit and shared across layers.
3. Edge-case tests should pin rounding behavior consistently.
