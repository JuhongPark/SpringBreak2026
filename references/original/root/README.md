# PS-3 SpringBreak2026

Node + Express app that uses the latest `@openai/agents` SDK to plan a Spring Break trip for any destination city.

## Project Priorities

1. Use agents effectively for clear role separation and reliable orchestration.
2. Use the `@openai/agents` SDK correctly and consistently across the full workflow.
3. Prioritize strong logging and visibility:
   - Make AI behavior observable (what actions were taken, which tools were called, and how the SDK was used).
   - Keep logs detailed enough to support rollback, replay, and safe re-planning when issues occur.
   - Build logging first, then add a system for reviewing and analyzing those logs effectively.

## Baseline Usage Rule

- Treat the original baseline as a requirement boundary, not as unquestionable implementation truth.
- Keep required constraints, but actively challenge initial assumptions with evidence from logs, tests, and user feedback.
- If observed behavior conflicts with initial assumptions, update design and implementation while preserving baseline requirements.

## Logging Definition Of Done

Logging is considered complete only when all items below are implemented:

- Every planning request has a unique `traceId` and each event includes `timestamp`, `traceId`, `stage`, `agent`, `status`.
- Every model call logs: prompt sent, model used, response received, latency, token usage (if available).
- Every tool call logs: tool name, sanitized arguments, start/end status, latency, and error details on failure.
- Required core events are emitted and visible:
  - `planning_started`, `planning_completed`
  - `agent_invoked`, `prompt_sent`, `model_response_received`
  - `tool_call_started`, `tool_call_completed`, `tool_call_failed`
  - `fallback_triggered`, `retry_started`, `rollback_started`, `rollback_completed`
  - `final_confirmation_requested`, `final_confirmation_received`
- Logs are queryable by `traceId` so a full session can be replayed step-by-step.
- UI visibility and internal debug logs are separated by level (user-safe timeline vs. full diagnostic logs).

## Failure Handling Matrix

Unexpected situations must follow explicit fallback/recovery rules:

- Missing or low-confidence search results:
  - Trigger `fallback_triggered`
  - Ask agent to broaden query once
  - If still insufficient, present partial options and request user preference updates
- Tool timeout or transient SDK/API error:
  - Retry with bounded attempts (recommended: max 2)
  - Emit `retry_started` with attempt count
  - If retries fail, continue with remaining components and mark failed section clearly
- Invalid or unparsable model output:
  - Run one repair pass with stricter formatting instructions
  - If still invalid, return safe error and request user to retry planning
- Price/schedule inconsistency across components:
  - Trigger reconciliation step before final itinerary
  - Recalculate dependent nights/days/costs
  - If inconsistency remains, block final confirmation and explain what must be changed
- User confirmation conflict (e.g., selected option no longer valid):
  - Re-fetch options for that component
  - Preserve previous selections in logs for auditability

## Data Safety And Visibility Rules

- Never log secrets (API keys, auth headers, raw credentials).
- Sanitize personal/sensitive user fields before persistence or UI rendering.
- User-facing timeline must exclude sensitive internal payloads while preserving action transparency.
- Internal logs should keep diagnostic detail needed for rollback/replay but remain access-controlled.
- Define retention policy for logs and provide clear deletion behavior for stale sessions.

## Implementation Roadmap

1. Baseline Audit
2. Market Research
3. Extract Best Ideas
4. Define Success Criteria
5. Make Plan
6. Implementation
7. Evaluation
8. Feedback and Iteration

### Roadmap Execution Gates

- Gate A (after Baseline Audit): list assumptions that can fail in real usage and define how each will be validated.
- Gate B (after Implementation): verify observability and failure handling with scenario tests before feature expansion.
- Gate C (after Evaluation): remove or revise assumptions that are not supported by runtime evidence.
- Gate D (during Iteration): prioritize fixes based on reliability risk, then improve autonomy only after stability is proven.
- At the start of each implementation cycle, run `npm run cycle:cleanup` to reset local runtime logs for a clean iteration baseline.
  - Cleanup runs only after explicit confirmation input (`DELETE LOGS`) from the operator.

### Gate Acceptance Criteria

- Gate A is complete only when at least 10 explicit assumptions are documented with:
  - failure signal
  - validation method
  - owner
- Gate B is complete only when scenario tests pass for:
  - tool timeout
  - empty/low-confidence search output
  - invalid model JSON output
  - confirmation conflict
- Gate C is complete only when each failed assumption has:
  - a documented root cause
  - a code or prompt change linked to that cause
  - a verification result after the change
- Gate D is complete only when:
  - no P0/P1 reliability issue remains open
  - observability checks remain green for 2 consecutive iterations

## Implementation Alignment Checklist

Use this checklist in each iteration review:

- Event schema alignment:
  - All required events in "Logging Definition Of Done" are emitted.
  - Every event includes `traceId`, `timestamp`, `stage`, `agent`, `status`.
- Safety alignment:
  - User-facing timeline excludes raw sensitive payloads.
  - Prompt/tool payload visibility follows sanitization rules.
- Reliability alignment:
  - Retry/fallback behavior follows "Failure Handling Matrix".
  - Replay path is possible from persisted logs for completed sessions.
- UX/API alignment:
  - Final confirmation supports both approve and reject paths.

## Roadmap Artifacts

- `references/implementation/01_baseline_audit.md`
- `references/implementation/02_market_research.md`
- `references/implementation/03_best_ideas_mapping.md`
- `references/implementation/04_success_criteria.md`
- `references/implementation/05_execution_plan.md`
- `references/implementation/06_assumption_register.md`
- `references/implementation/07_evaluation_report.md`
- `references/implementation/08_iteration_log.md`
- `references/implementation_cycle2/01_baseline_audit.md`
- `references/implementation_cycle2/02_market_research.md`
- `references/implementation_cycle2/03_best_ideas_mapping.md`
- `references/implementation_cycle2/04_success_criteria.md`
- `references/implementation_cycle2/05_execution_plan.md`
- `references/implementation_cycle2/06_assumption_register.md`
- `references/implementation_cycle2/07_evaluation_report.md`
- `references/implementation_cycle2/08_iteration_log.md`
- `references/implementation_cycle3/01_baseline_audit.md`
- `references/implementation_cycle3/02_market_research.md`
- `references/implementation_cycle3/03_best_ideas_mapping.md`
- `references/implementation_cycle3/04_success_criteria.md`
- `references/implementation_cycle3/05_execution_plan.md`
- `references/implementation_cycle3/06_assumption_register.md`
- `references/implementation_cycle3/07_evaluation_report.md`
- `references/implementation_cycle3/08_iteration_log.md`
- `references/implementation_cycle4/01_baseline_audit.md`
- `references/implementation_cycle4/02_market_research.md`
- `references/implementation_cycle4/03_best_ideas_mapping.md`
- `references/implementation_cycle4/04_success_criteria.md`
- `references/implementation_cycle4/05_execution_plan.md`
- `references/implementation_cycle4/06_assumption_register.md`
- `references/implementation_cycle4/07_evaluation_report.md`
- `references/implementation_cycle4/08_iteration_log.md`
- `references/implementation_cycle5/01_baseline_audit.md`
- `references/implementation_cycle5/02_market_research.md`
- `references/implementation_cycle5/03_best_ideas_mapping.md`
- `references/implementation_cycle5/04_success_criteria.md`
- `references/implementation_cycle5/05_execution_plan.md`
- `references/implementation_cycle5/06_assumption_register.md`
- `references/implementation_cycle5/07_evaluation_report.md`
- `references/implementation_cycle5/08_iteration_log.md`
- `references/implementation_cycle6/01_baseline_audit.md`
- `references/implementation_cycle6/02_market_research.md`
- `references/implementation_cycle6/03_best_ideas_mapping.md`
- `references/implementation_cycle6/04_success_criteria.md`
- `references/implementation_cycle6/05_execution_plan.md`
- `references/implementation_cycle6/06_assumption_register.md`
- `references/implementation_cycle6/07_evaluation_report.md`
- `references/implementation_cycle6/08_iteration_log.md`
- `references/implementation_cycle7/01_baseline_audit.md`
- `references/implementation_cycle7/02_market_research.md`
- `references/implementation_cycle7/03_best_ideas_mapping.md`
- `references/implementation_cycle7/04_success_criteria.md`
- `references/implementation_cycle7/05_execution_plan.md`
- `references/implementation_cycle7/06_assumption_register.md`
- `references/implementation_cycle7/07_evaluation_report.md`
- `references/implementation_cycle7/08_iteration_log.md`
- `references/implementation_cycle8/01_baseline_audit.md`
- `references/implementation_cycle8/02_market_research.md`
- `references/implementation_cycle8/03_best_ideas_mapping.md`
- `references/implementation_cycle8/04_success_criteria.md`
- `references/implementation_cycle8/05_execution_plan.md`
- `references/implementation_cycle8/06_assumption_register.md`
- `references/implementation_cycle8/07_evaluation_report.md`
- `references/implementation_cycle8/08_iteration_log.md`
- `references/implementation_cycle9/01_baseline_audit.md`
- `references/implementation_cycle9/02_market_research.md`
- `references/implementation_cycle9/03_best_ideas_mapping.md`
- `references/implementation_cycle9/04_success_criteria.md`
- `references/implementation_cycle9/05_execution_plan.md`
- `references/implementation_cycle9/06_assumption_register.md`
- `references/implementation_cycle9/07_evaluation_report.md`
- `references/implementation_cycle9/08_iteration_log.md`
- `references/implementation_cycle10/01_baseline_audit.md`
- `references/implementation_cycle10/02_market_research.md`
- `references/implementation_cycle10/03_best_ideas_mapping.md`
- `references/implementation_cycle10/04_success_criteria.md`
- `references/implementation_cycle10/05_execution_plan.md`
- `references/implementation_cycle10/06_assumption_register.md`
- `references/implementation_cycle10/07_evaluation_report.md`
- `references/implementation_cycle10/08_iteration_log.md`

The app:

- Collects user inputs for trip timing, length, departure city, destination, activities, weather preferences, air travel class (`economy` or `business`), and hotel class (`3`, `4`, `5` stars)
- Uses multiple agents and tools (including OpenAI Web Search) to generate options for:
  - Air travel
  - Hotel
  - Car rental
  - Activities
  - Safety concerns and packing list
- Shows estimated costs in USD
- Computes destination days/nights from start/end dates and flight schedule timing (including overnight flights)
- Aligns hotel nights and car rental days/costs to computed destination stay
- Streams a live agent activity timeline so users can follow:
  - prompts sent to each agent
  - responses returned by each agent
  - tool calls (including arguments) and tool outputs
  - stage-level summaries
- Asks the user to confirm each component
- Presents a final itinerary for final confirmation
- Accounts for unexpected situations by defining fallback and recovery handling (e.g., missing options, tool failures, schedule changes)
- Never purchases anything

## Agent Design

- `TripResearchAgent`: Finds realistic flight/hotel/car/activity options and pricing
- `SafetyPackingAgent`: Produces safety notes, local transport advice, and packing items
- `ItineraryComposerAgent`: Builds a structured itinerary with confirmation questions
- `FinalReviewAgent`: Produces final summary + final confirmation prompt

## Tools Used by Agents

- OpenAI hosted Web Search tool (`webSearchTool()`)
- Custom `budget_calculator` function tool for itemized USD calculations
- Standardized tool monitoring for both hosted (built-in) and custom tools via:
  - `tool_call_started`
  - `tool_call_completed`
  - derived web search events: `web_search_called`, `web_search_output`

## Project Structure

- `server.js`: Express server + API routes + in-memory itinerary state
- `src/agents/tripPlanner.js`: Agent setup, tools, orchestration, validation
- `public/index.html`: Input form + itinerary UI
- `public/app.js`: Frontend logic for planning and confirmations
- `public/styles.css`: Minimal styling

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set your API key:

   ```
   OPENAI_API_KEY=...
   OPENAI_MODEL=gpt-4.1-mini
   PORT=3000
   ```

## Run

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Open:

- `http://localhost:3000`

## API Endpoints

- `POST /api/plan`
  - Builds itinerary draft from user trip preferences
- `POST /api/plan-stream`
  - Streams planning activity events (`research`, `safety`, `composition`) and final itinerary result
- `POST /api/confirm-component`
  - Confirms one component (`flight`, `hotel`, `carRental`) by selected option ID
- `POST /api/final-confirmation`
  - Final yes/no itinerary approval
- `GET /api/traces/:traceId`
  - Returns persisted trace events for replay/diagnostics by trace ID
- `GET /api/traces/:traceId/summary`
  - Returns aggregated trace diagnostics (event counts, status counts, failures, duration)
- `GET /api/traces/:traceId/report`
  - Returns stage-level durations, critical events, and failure-oriented trace diagnostics
- `GET /api/traces/:traceId/stage-breakdown`
  - Returns per-stage event counts, failure counts, status distribution, and stage durations
- `GET /api/traces/:traceId/anomalies`
  - Returns threshold-based anomaly diagnostics derived from trace report metrics
  - Supports optional profile presets: `profile=strict|default|lenient`
  - Supports optional query overrides: `maxDurationMs`, `maxStageDurationMs`, `maxRetries`, `maxFallbacks`, `maxFailures`
- `GET /api/traces/:traceId/health`
  - Returns health status (`healthy|degraded|critical`) and score (0-100) derived from anomaly severities
  - Supports the same optional profile/threshold query parameters as `/api/traces/:traceId/anomalies`
- `GET /api/traces/:traceId/snapshot`
  - Returns compact operational snapshot (status, score, top anomaly, retry/fallback/failed counts, recommended actions)
  - Supports the same optional profile/threshold query parameters as `/api/traces/:traceId/anomalies`
- `GET /api/health`
  - Health check

## Example Test Destinations

Use the UI and test trips to cities like:

- Paris
- Milan
- Madrid
- Taipei
- Hong Kong
- London

## Important Constraint

This application is planning-only. It never purchases flights, hotels, rentals, or activities.
