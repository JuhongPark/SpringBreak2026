# Assumption Register - Cycle 12

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Triage priority should map directly from health status | inconsistent priority | unit tests | Engineering |
| 2 | Action list should reflect top anomaly signals | irrelevant actions | anomaly-to-action assertions | Engineering |
| 3 | Bottleneck stage should produce latency-focused action | missing bottleneck guidance | triage output test | Engineering |
| 4 | Action list deduplication prevents noise | repeated actions | output inspection | Engineering |
| 5 | Existing insights/snapshot endpoints remain unchanged | regressions | full suite run | Engineering |
| 6 | Triage endpoint should support threshold controls | mismatch with anomalies behavior | endpoint contract review | Engineering |
| 7 | Priority levels are sufficient for initial responder routing | ambiguous urgency | responder feedback review | Engineering |
| 8 | Compact triage payload improves response speed | no practical gain | operational metric review | Engineering |
| 9 | Triage plan should avoid sensitive detail leakage | raw debug payload in actions | response inspection | Engineering |
|10| Triage plan remains deterministic | flaky output across runs | repeated tests | Engineering |
