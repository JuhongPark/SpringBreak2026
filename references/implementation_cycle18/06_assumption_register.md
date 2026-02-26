# Assumption Register - Cycle 18

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | Server-selected summary should be source of truth after confirm/reset/final actions | UI total differs from API summary | manual flow check + payload inspection | Engineering |
| 2 | Local edits should temporarily override server summary | stale server total after radio change | interaction verification | Engineering |
| 3 | Invalid summary payload must be ignored safely | NaN/undefined rendered in cost UI | normalization guard inspection | Engineering |
| 4 | New client summary state should not break final approve/reject flow | missing/incorrect final messages or totals | end-to-end manual walkthrough | Engineering |
| 5 | Existing tests remain stable after client sync change | test failures | `npm test` | Engineering |
