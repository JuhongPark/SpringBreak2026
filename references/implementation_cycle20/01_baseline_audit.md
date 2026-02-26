# Baseline Audit - Cycle 20 (2026-02-26)

## Starting point
- Cycle 19 hardened activity-cost aggregation against invalid/negative values.
- Core pricing tests and suite were green.

## Gap selected
- Option count fields (`nights`, `rentalDays`) can arrive as fractional values from model output.
- Fractional counts create ambiguous pricing behavior unless normalized.

## Objective
- Normalize fractional count fields to deterministic integer values.
- Keep frontend/backend pricing rules consistent.
- Add regression tests for fractional count handling.
