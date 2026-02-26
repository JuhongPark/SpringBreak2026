# Assumption Register - Cycle 17

| # | Assumption | Failure signal | Validation method | Owner |
|---|---|---|---|---|
| 1 | API responses should expose selected-summary state for better observability | client cannot reconcile totals after confirm/reset | response contract inspection | Engineering |
| 2 | Confirmed option IDs should override recommendations in summary | selected totals ignore confirmations | unit test with overrides | Engineering |
| 3 | Invalid option IDs should not break summary calculation | exception or incorrect null totals | invalid-id fallback test | Engineering |
| 4 | Reusing helper in estimate totals reduces drift risk | mismatched totals between code paths | helper integration + tests | Engineering |
| 5 | Endpoint payload additions remain backward compatible | client parsing regressions | smoke validation + test suite | Engineering |
