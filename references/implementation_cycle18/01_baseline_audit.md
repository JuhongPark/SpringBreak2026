# Baseline Audit - Cycle 18 (2026-02-26)

## Starting point
- Cycle 17 added server-side `selectedCostSummary` in confirm/reset/final APIs.
- Frontend still computed totals locally and did not consume server summary payloads.

## Gap selected
- UI could diverge from server-derived selected totals across confirmation transitions.
- No explicit client-side guard existed for invalid server summary payloads.

## Objective
- Integrate server-provided selected cost summary into frontend rendering.
- Keep local recomputation for in-progress radio changes before server confirmation.
- Add a safe normalization step for server summary payloads.
