# Market Research - Cycle 4 (2026-02-25)

## Focus
Incident triage workflows in observability systems.

## Sources reviewed
- Datadog APM trace analytics concepts: https://docs.datadoghq.com/tracing/trace_explorer/trace_queries/
- New Relic distributed tracing concepts: https://docs.newrelic.com/docs/distributed-tracing/concepts/distributed-tracing/

## Patterns extracted
1. Keep layered diagnostics: summary -> report -> raw events.
2. Stage-level timing and failure hotspot visibility significantly reduce MTTR.
3. Critical-event slicing is useful for fast root-cause hints.
