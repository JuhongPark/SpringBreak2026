# Best Ideas Mapping - Cycle 20 (2026-02-26)

1. Integer normalization for count fields
- Implemented: `nights` and `rentalDays` are now rounded to nearest integer before cost multiplication.

2. Frontend/backend parity
- Implemented: same count normalization logic applied in frontend local summary path.

3. Regression coverage
- Implemented: tests added for fractional count inputs in option-cost computation.
