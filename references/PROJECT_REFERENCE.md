# Project Reference

## Context
This document captures project direction based on the instructor guidance for using the `@openai/agents` SDK.

## Core Goal
Build hands-on experience with:
- Agents
- Tools
- LLM calls

There is no single perfect architecture, but reliability and observability should be prioritized.

## Required UI Visibility
The UI should clearly show runtime activity:
- Which agent is called
- Which tool is called
- Prompts sent to the model
- Responses returned from the model

## Implementation Strategy
Start with simple workflows, then expand complexity.

### Phase 1: Simple Workflow
Build a minimal flow:
- User inputs travel dates
- System searches flight options
- User selects a preferred flight

Use `webSearchTool` from the SDK to find air travel options.

### Phase 2: Orchestrated Workflow
Introduce a Planner/Orchestrator agent that runs tasks in sequence.

Preferred approach for now:
- Hard-code task schedule (more reliable than LLM-planned scheduling initially)

Suggested sequence:
1. Confirm travel dates
2. Find/select flights
3. Find/select hotels
4. Find/select car rental

## Architecture Guidance
- Orchestrator may call tools directly, other agents, or both.
- Keep workflow deterministic first, then incrementally add autonomy.
- Prioritize traceability of agent/tool/model interactions in the UI.

## Prompting Workflow Suggestion
- Use ChatGPT to learn how to prompt effectively for implementation tasks.
- Use those refined prompts in VS Code Copilot while coding.
- Be explicit that the project uses the `@openai/agents` SDK when asking for help.

## Practical Definition of Done (Initial)
- A working simple travel flow (dates -> flights -> selection)
- Observable logs/events rendered in UI for agent/tool/model exchanges
- A hard-coded orchestrator sequence for multi-step planning
