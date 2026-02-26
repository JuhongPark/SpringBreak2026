# Baseline Audit - Cycle 21 (2026-02-26)

## Starting point
- Cycle 20 normalized fractional `nights`/`rentalDays` using rounded integer conversion.
- Pricing tests remained green.

## Gap selected
- Small positive fractional counts (e.g., `0.4`) could round to `0`, producing zero lodging/rental cost.
- This underestimates totals and harms pricing realism.

## Objective
- Enforce minimum count of `1` for positive fractional count inputs.
- Keep zero as zero only when input is exactly `0`.
- Maintain frontend/backend parity and add regression tests.
