# Assumption Register - Cycle 6

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Query overrides should not break default behavior | anomaly output drift | tests with and without overrides | Engineering |
| 2 | Recommended actions improve operator response time | no practical usage | feedback next cycle | Engineering |
| 3 | Severity counts are enough for first-pass triage | unresolved prioritization | incident drill review | Engineering |
| 4 | Numeric query parsing should ignore invalid values safely | crash or NaN thresholds | parser behavior check | Engineering |
| 5 | Threshold flexibility reduces false positives | alert noise unchanged | threshold tuning trial later | Engineering |
| 6 | Endpoint compatibility remains intact | regression in anomalies route | route smoke + test suite | Engineering |
| 7 | Static rule recommendations are acceptable for now | misleading recommendations | review with real traces | Engineering |
| 8 | Existing anomaly rules remain deterministic | flaky outputs | repeated tests | Engineering |
| 9 | Documentation is clear enough for override usage | misuse of query params | doc review | Engineering |
|10| Added fields do not break existing consumers | client parse failure | backward-compatible schema check | Engineering |
