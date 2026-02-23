# Project Sequence

## Purpose
Execution sequence for building and improving this project with strong reliability, observability, and iteration discipline.

## IMPORTANT
All work must satisfy the original instructor requirements captured in:
- `references/original/root/README.md`

Do not remove, weaken, or bypass those baseline requirements during planning, implementation, evaluation, or iteration.

## Sequence
1. Baseline audit
2. Market research
3. Extract best ideas
4. Define success criteria
5. Make plan
6. Implementation
7. Evaluation
8. Feedback and iteration

## Step Details

### 1) Baseline Audit
- Review current app behavior and architecture.
- Identify what already works vs. what is missing.
- Record technical constraints and risks.

### 2) Market Research
- Review relevant travel-planning products and flows.
- Focus on interaction quality, clarity, and trust signals.
- Note practical patterns that can fit this project scope.

### 3) Extract Best Ideas
- Convert research into concrete UI and workflow patterns.
- Keep only ideas that are implementable now.
- Prefer deterministic and debuggable patterns first.

### 4) Define Success Criteria
- Observability: user can see agent/tool/model activity in UI.
- Workflow quality: sequence stays clear and predictable.
- Output quality: recommendations are concise, useful, and grounded.
- Reliability: failures are visible and recoverable.

### 5) Make Plan
- Use hard-coded sequence first:
  1. Confirm dates
  2. Flights
  3. Hotel
  4. Car rental
- Break implementation into small milestones.
- Define acceptance checks for each milestone.

### 6) Implementation
- Build incrementally:
  1. One agent + `webSearchTool` flow
  2. UI trace panel for runtime events
  3. Orchestrated multi-step sequence
  4. Retry/fallback behavior

### 7) Evaluation
- Validate each milestone against success criteria.
- Confirm every tool call and model response is inspectable.
- Verify deterministic behavior before adding complexity.

### 8) Feedback And Iteration
- Collect feedback from real usage.
- Prioritize fixes by user impact and reliability risk.
- Iterate in small cycles; only then add advanced autonomy.

## Definition Of Excellent Execution
- Clear and visible runtime behavior.
- Deterministic orchestration before dynamic planning.
- Small, typed, well-scoped tools.
- Measurable improvements each iteration.
