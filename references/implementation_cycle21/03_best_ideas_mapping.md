# Best Ideas Mapping - Cycle 21 (2026-02-26)

1. Positive-minimum count policy
- Implemented: `toNonNegativeCount` now returns at least `1` when input is positive.

2. Explicit zero handling
- Implemented: exact `0` remains `0`, preserving explicit zero semantics.

3. Frontend/backend parity
- Implemented: same boundary policy applied in frontend and backend helpers.

4. Boundary regression tests
- Implemented: tests for `0<x<1` counts ensure non-zero derived costs.
