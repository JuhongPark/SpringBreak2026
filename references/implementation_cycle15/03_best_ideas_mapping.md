# Best Ideas Mapping - Cycle 15 (2026-02-26)

1. Explicit-first pricing
- Implemented: `computeOptionCostUsd` prioritizes `costUsd` when present and valid.

2. Deterministic fallback formulas
- Implemented: hotel fallback uses `nightlyUsd * nights`.
- Implemented: car rental fallback now supports `dailyRateUsd * rentalDays`.

3. Testable business rule extraction
- Implemented: option-cost calculation extracted into exported helper for direct unit testing.

4. Regression guard
- Implemented: new `tripPlannerCost.test.js` covers primary and fallback paths.
