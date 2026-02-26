import test from "node:test";
import assert from "node:assert/strict";
import { computeOptionCostUsd, computeSelectedCostSummary } from "../src/agents/tripPlanner.js";

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

test("computeSelectedCostSummary uses confirmed optionIds when present", () => {
  const itinerary = {
    components: {
      flight: {
        recommendedOptionId: "f1",
        options: [
          { id: "f1", costUsd: 455 },
          { id: "f2", costUsd: 600 }
        ]
      },
      hotel: {
        recommendedOptionId: "h1",
        options: [
          { id: "h1", nightlyUsd: 200, nights: 7 },
          { id: "h2", nightlyUsd: 250, nights: 7 }
        ]
      },
      carRental: {
        recommendedOptionId: "c1",
        options: [
          { id: "c1", dailyRateUsd: 50, rentalDays: 8 },
          { id: "c2", dailyRateUsd: 70, rentalDays: 8 }
        ]
      }
    },
    activities: [{ estimatedCostUsd: 60 }, { estimatedCostUsd: 75 }]
  };
  const confirmations = {
    flight: { optionId: "f2" },
    hotel: { optionId: "h2" },
    carRental: { optionId: "c2" }
  };

  const summary = computeSelectedCostSummary(itinerary, confirmations);
  assert.equal(summary.flightUsd, 600);
  assert.equal(summary.hotelUsd, 1750);
  assert.equal(summary.carRentalUsd, 560);
  assert.equal(summary.activitiesUsd, 135);
  assert.equal(summary.totalUsd, 3045);
});

test("computeSelectedCostSummary falls back to recommended/default option when confirmation id is invalid", () => {
  const itinerary = {
    components: {
      flight: {
        recommendedOptionId: "f1",
        options: [{ id: "f1", costUsd: 455 }]
      },
      hotel: {
        recommendedOptionId: "h1",
        options: [{ id: "h1", nightlyUsd: 200, nights: 7 }]
      },
      carRental: {
        recommendedOptionId: "c1",
        options: [{ id: "c1", dailyRateUsd: 50, rentalDays: 8 }]
      }
    },
    activities: [{ estimatedCostUsd: 40 }]
  };
  const confirmations = {
    flight: { optionId: "missing-id" }
  };

  const summary = computeSelectedCostSummary(itinerary, confirmations);
  assert.equal(summary.flightUsd, 455);
  assert.equal(summary.hotelUsd, 1400);
  assert.equal(summary.carRentalUsd, 400);
  assert.equal(summary.activitiesUsd, 40);
  assert.equal(summary.totalUsd, 2295);
});
