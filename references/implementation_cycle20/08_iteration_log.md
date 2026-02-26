# Iteration Log - Cycle 20 (2026-02-26)

## Iteration 1
- Selected fractional count handling (`nights`, `rentalDays`) as reliability target.
- Confirmed mismatch risk if counts are not normalized.
- Result: scope fixed.

## Iteration 2
- Implemented count normalization to rounded integers in backend helper.
- Applied same logic in frontend helper for parity.
- Result: deterministic count handling established.

## Iteration 3
- Added fractional-count test coverage.
- Ran syntax checks and full suite.
- Result: all checks green.

## Verification
- `node --check src/agents/tripPlanner.js`
- `node --check public/app.js`
- `node --check test/tripPlannerCost.test.js`
- `npm test` (pass=4, fail=0)

## Final status
- GREEN
