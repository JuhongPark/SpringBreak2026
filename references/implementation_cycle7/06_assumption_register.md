# Assumption Register - Cycle 7

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Strict profile should detect more anomalies than default | no sensitivity difference | profile comparison tests | Engineering |
| 2 | Lenient profile should reduce noise | same anomaly volume as strict | threshold sanity tests | Engineering |
| 3 | Override precedence must be deterministic | inconsistent outputs | merged threshold logic test | Engineering |
| 4 | Unknown profile should fall back safely | crash or empty profile | fallback profile test | Engineering |
| 5 | Profile metadata should be visible in response | missing profile field | API contract check | Engineering |
| 6 | Existing anomaly behavior remains compatible | regression in anomalies route | full test suite | Engineering |
| 7 | Recommendations still map correctly after profile addition | empty actions | recommendation tests | Engineering |
| 8 | Profile logic remains easy to tune later | rigid hardcoding pain | centralized profile table review | Engineering |
| 9 | Overrides should not require all params | incomplete override failure | partial override test | Engineering |
|10| Documentation should prevent misuse | incorrect query usage | README review | Engineering |
