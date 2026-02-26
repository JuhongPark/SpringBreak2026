# Assumption Register - Cycle 5

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Threshold-based rules are sufficient for current scale | missed anomalies | test with synthetic traces | Engineering |
| 2 | Retry/fallback counts are reliable anomaly signals | false positives | threshold calibration review | Engineering |
| 3 | Failed event count should be critical by default | noisy critical alerts | team feedback review | Engineering |
| 4 | Stage duration windows indicate bottlenecks | misleading stage metrics | compare with raw trace samples | Engineering |
| 5 | Summary/report data remains stable enough for anomaly logic | schema breakage | unit tests + contract review | Engineering |
| 6 | Endpoint adds negligible overhead | response latency spike | perf test | Engineering |
| 7 | Default thresholds are acceptable baseline | too strict/loose behavior | production-like data review | Engineering |
| 8 | Determinism holds for same input trace | flaky outputs | repeated test runs | Engineering |
| 9 | Critical/warning severities help triage | ignored alerts | operator feedback | Engineering |
|10| Additional anomaly layer does not break existing APIs | regressions in summary/report | route-level smoke checks | Engineering |
