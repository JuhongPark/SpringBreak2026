# Market Research - Cycle 15 (2026-02-26)

## Focus
Deterministic price-derivation patterns for multi-option travel components.

## Sources reviewed
- Pricing fallback strategy concepts (composed rates vs explicit totals): https://martinfowler.com/
- Test-first reliability practices for business rules: https://testingjavascript.com/

## Patterns extracted
1. Prefer explicit totals (`costUsd`) when available.
2. Use deterministic fallback formulas when explicit totals are missing.
3. Keep fallback order stable and covered by tests.
4. Expose pure helpers for business-rule testing when practical.
