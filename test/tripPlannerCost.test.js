import test from "node:test";
import assert from "node:assert/strict";
import { computeOptionCostUsd } from "../src/agents/tripPlanner.js";

test("computeOptionCostUsd prefers explicit costUsd when present", () => {
  const option = {
    costUsd: 455,
    nightlyUsd: 200,
    nights: 3
  };
  assert.equal(computeOptionCostUsd(option), 455);
});

test("computeOptionCostUsd derives hotel cost from nightlyUsd and nights", () => {
  const option = {
    nightlyUsd: 250,
    nights: 7
  };
  assert.equal(computeOptionCostUsd(option), 1750);
});

test("computeOptionCostUsd derives car rental cost from dailyRateUsd and rentalDays", () => {
  const option = {
    dailyRateUsd: 50,
    rentalDays: 8
  };
  assert.equal(computeOptionCostUsd(option), 400);
});

test("computeOptionCostUsd returns 0 for invalid or missing values", () => {
  assert.equal(computeOptionCostUsd(null), 0);
  assert.equal(computeOptionCostUsd({}), 0);
  assert.equal(computeOptionCostUsd({ dailyRateUsd: "50", rentalDays: 8 }), 0);
  assert.equal(computeOptionCostUsd({ costUsd: -5 }), 0);
  assert.equal(computeOptionCostUsd({ nightlyUsd: 120, nights: -2 }), 0);
  assert.equal(computeOptionCostUsd({ dailyRateUsd: -10, rentalDays: 3 }), 0);
});

test("computeOptionCostUsd rounds decimal values to cents", () => {
  assert.equal(computeOptionCostUsd({ costUsd: 455.456 }), 455.46);
  assert.equal(computeOptionCostUsd({ nightlyUsd: 199.995, nights: 3 }), 599.99);
  assert.equal(computeOptionCostUsd({ dailyRateUsd: 49.995, rentalDays: 8 }), 399.96);
});
