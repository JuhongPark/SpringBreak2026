# Market Research - Cycle 2 (2026-02-25)

## Focus
Reliability and observability patterns for production AI orchestration.

## Sources reviewed
- OpenAI API error code guidance: https://platform.openai.com/docs/guides/error-codes
- Stripe reliability patterns (retry/idempotency): https://stripe.com/blog/idempotency
- Google SRE Error Budgets (availability governance): https://sre.google/workbook/error-budget-policy/

## Patterns extracted
1. Retry only on transient classes (network/timeout/rate-limit/5xx), not all failures.
2. Retention must be an explicit policy with execution in code, not documentation only.
3. Observability should preserve replayability without exposing sensitive data by default.
