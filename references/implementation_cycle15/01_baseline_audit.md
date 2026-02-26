# Baseline Audit - Cycle 15 (2026-02-26)

## Starting point
- Cycle 14 documented validation priorities and highlighted lack of automated checks for some UI/flow cases.
- Current cost logic is split between frontend and backend layers.

## Gap selected
- Backend option cost fallback logic did not explicitly cover `dailyRateUsd * rentalDays` when `costUsd` is absent.
- No dedicated unit tests existed for trip option cost derivation rules.

## Objective
- Align backend option-cost derivation with frontend behavior.
- Add unit tests for option-cost computation to reduce regression risk.
