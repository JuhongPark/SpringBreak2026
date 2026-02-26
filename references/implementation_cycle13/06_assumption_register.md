# Assumption Register - Cycle 13

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Compact timeline (top 3) improves scan speed | users miss older events | toggle discoverability check | Engineering |
| 2 | Status pills improve runtime comprehension | ambiguous state perception | UI inspection + reviewer feedback | Engineering |
| 3 | DAG summary is enough for dependency understanding | users still ask ordering questions | usability feedback | Engineering |
| 4 | Confirm/cancel flow reduces lock-in frustration | repeated reset confusion | manual flow walkthrough | Engineering |
| 5 | Cost summary should reflect selected options, not only recommendations | mismatch with selected option | selection-to-cost verification | Engineering |
| 6 | Reject should reset all confirmations for clean restart | partial stale confirmation remains | API response + UI state check | Engineering |
| 7 | New reset endpoint does not regress existing confirmation routes | 4xx/5xx spikes on confirmation path | endpoint smoke test | Engineering |
| 8 | Hero/branding changes should not reduce form readability | low contrast in core form area | visual QA on desktop/mobile | Engineering |
| 9 | Key/value formatting improves option detail clarity vs raw JSON | users request raw JSON fallback frequently | review notes in next round | Engineering |
|10| Existing tests are sufficient to detect core regressions | bug escapes in UI state handling | next-cycle targeted tests | Engineering |
