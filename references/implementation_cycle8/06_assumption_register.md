# Assumption Register - Cycle 8

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Health score should be deterministic | inconsistent scores | repeated test inputs | Engineering |
| 2 | Critical anomalies must dominate status | degraded status despite critical | severity mapping test | Engineering |
| 3 | Warning-only anomalies should map to degraded | healthy status on warnings | health mapping test | Engineering |
| 4 | No anomalies should map to healthy 100 | lower baseline score | healthy baseline test | Engineering |
| 5 | Reasons should preserve anomaly explainability | empty reasons on anomalies | reasons output test | Engineering |
| 6 | Health endpoint should mirror anomaly threshold controls | mismatched behavior | endpoint contract review | Engineering |
| 7 | Score formula should remain simple and transparent | opaque logic complaints | formula docs in code review | Engineering |
| 8 | Existing endpoints remain unaffected | regressions in summary/report/anomalies | full test suite | Engineering |
| 9 | API consumers can use status + score quickly | adoption issues | feedback next cycle | Engineering |
|10| Additional endpoint overhead is acceptable | noticeable latency increase | future perf check | Engineering |
