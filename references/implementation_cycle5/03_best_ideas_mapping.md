# Best Ideas Mapping - Cycle 5 (2026-02-25)

1. Threshold-driven anomaly detection
- Implemented: `detectTraceAnomalies(report, thresholds)`.

2. Separate anomaly API for quick triage
- Implemented: `GET /api/traces/:traceId/anomalies`.

3. Test-backed anomaly rules
- Implemented: unit tests for duration, retry, fallback, and failure anomaly rules.
