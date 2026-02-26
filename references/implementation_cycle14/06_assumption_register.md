# Assumption Register - Cycle 14

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Confirm/cancel transitions are deterministic | stale button/selection states | step matrix walkthrough | Engineering |
| 2 | Final reject always resets full confirmation state | final review remains visible after reject | reject-path verification | Engineering |
| 3 | Cost summary mirrors selected options instantly | stale totals after radio change | option-to-total checks | Engineering |
| 4 | Compact monitor view still preserves discoverability | users cannot find older events | toggle discoverability check | Engineering |
| 5 | Hero readability is acceptable across breakpoints | low-contrast text reports continue | desktop/mobile visual QA | Engineering |
| 6 | Backend reset endpoint remains stable under repeated use | intermittent 4xx/5xx | repeated API flow checks | Engineering |
| 7 | Existing automated tests are enough for backend regressions | test pass but runtime failures emerge | repeated suite execution | Engineering |
| 8 | Manual UI matrix can catch most high-impact regressions for now | missed edge case in production-like usage | next-cycle integration-test planning | Engineering |
