# Assumption Register - Cycle 11

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Failure rate is meaningful for first-pass triage | no operator value | feedback next cycle | Engineering |
| 2 | Longest stage approximates bottleneck | misleading bottleneck | compare with raw traces | Engineering |
| 3 | Top 3 issues are enough for first response | missing major issue | anomaly ranking review | Engineering |
| 4 | Insights should mirror health/anomaly thresholds | inconsistent output | endpoint contract tests | Engineering |
| 5 | Insight payload should be stable for dashboard consumers | schema churn | docs + test checks | Engineering |
| 6 | Added endpoint should not impact existing APIs | regression | full suite tests | Engineering |
| 7 | Deterministic calculations avoid confusion | flaky outputs | repeated tests | Engineering |
| 8 | Failure rate precision (4 decimals) is sufficient | precision complaints | future UI feedback | Engineering |
| 9 | Triage speed improves with unified payload | unchanged MTTR | future operational review | Engineering |
|10| Insights avoid exposing sensitive debug data | sensitive fields leak | response inspection | Engineering |
