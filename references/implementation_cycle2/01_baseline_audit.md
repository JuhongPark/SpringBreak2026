# Baseline Audit - Cycle 2 (2026-02-25)

## Starting point
- Cycle 1 delivered event normalization, replay API, retry/fallback basics, and safe/debug UI separation.

## New gaps targeted in Cycle 2
- Retry classifier still depended too much on string matching.
- Trace retention policy existed in docs but was not enforced in runtime code.
- Test coverage did not include persistence/retention behavior.

## Risks
- False positives/negatives in retry decisions.
- Unlimited local trace growth over time.
- Drift between reliability policy and executable behavior.
