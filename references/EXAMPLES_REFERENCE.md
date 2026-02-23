# Methods And Ideas To Use

## Core Principles
- Build observable systems first, smart systems second.
- Keep the flow deterministic before adding autonomous planning.
- Design tools as small, typed, single-purpose actions.
- Treat Runner as the only orchestrator between tools and model.

## Runner Method
Use this loop as your mental model and implementation contract:
1. Send user input to model.
2. If model emits tool call, Runner executes tool.
3. Runner appends tool output to conversation state.
4. Runner calls model again.
5. Repeat until final response is produced.

Rule:
- Tools never send results directly to the model. Runner always mediates.

## Tool Design Method
- Give each tool one clear job.
- Define strict input schema for every tool.
- Return normalized outputs (consistent fields and types).
- Add explicit error payloads so model can recover (`code`, `message`, `retryable`).

## Prompting Method For Agents
- Agent instructions should force tool use when factual retrieval is required.
- Tell agent to produce concise output with links and prices for travel tasks.
- Instruct agent to avoid guesses when tool data is missing.

## Observability Method (UI + Logs)
Track and display these events:
- `agent_start`
- `agent_end`
- `agent_tool_start`
- `agent_tool_end`
- model/tool stream events
- final output

Minimum debug payload to show:
- active agent name
- tool name
- tool input arguments
- tool output preview
- final user-facing answer

## Workflow Method (Project-Specific)
Implement in this order:
1. Confirm travel dates.
2. Search and select flights.
3. Search and select hotels.
4. Search and select car rental.

Keep this sequence hard-coded first.
Only add LLM-generated scheduling after baseline reliability is proven.

## Delivery Method (Incremental)
1. One agent + one tool (`webSearchTool`) working end-to-end.
2. Add event streaming and UI trace panel.
3. Add orchestrator that runs fixed step sequence.
4. Add retry/fallback behavior for tool failures.
5. Add optional dynamic planning mode behind a feature flag.

## Quality Gate (Before Next Feature)
- Every step must be reproducible from logs.
- Every tool call must be inspectable in UI.
- No hidden prompts or silent tool execution.
- Failures must surface actionable messages, not generic errors.
