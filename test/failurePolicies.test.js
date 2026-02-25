import test from "node:test";
import assert from "node:assert/strict";
import {
  hasLowConfidenceResearch,
  shouldAttemptJsonRepair,
  shouldRetryAgentError,
  isConfirmationConflict
} from "../src/agents/failurePolicies.js";

test("tool timeout errors are retryable before max attempts", () => {
  const error = new Error("Tool request timed out after 30s");
  assert.equal(shouldRetryAgentError(error, 1, 2), true);
  assert.equal(shouldRetryAgentError(error, 2, 2), false);
});

test("HTTP status and structured error codes are retryable", () => {
  assert.equal(shouldRetryAgentError({ status: 429, message: "rate limit" }, 1, 2), true);
  assert.equal(shouldRetryAgentError({ statusCode: 503, message: "upstream unavailable" }, 1, 2), true);
  assert.equal(shouldRetryAgentError({ code: "ETIMEDOUT", message: "socket timeout" }, 1, 2), true);
  assert.equal(shouldRetryAgentError({ status: 400, message: "bad request" }, 1, 2), false);
});

test("empty or low-confidence research output triggers fallback", () => {
  assert.equal(
    hasLowConfidenceResearch({
      flightOptions: [],
      hotelOptions: [{ id: "h1" }],
      carRentalOptions: [{ id: "c1" }]
    }),
    true
  );
  assert.equal(
    hasLowConfidenceResearch({
      flightOptions: [{ id: "f1" }],
      hotelOptions: [{ id: "h1" }],
      carRentalOptions: [{ id: "c1" }]
    }),
    false
  );
});

test("invalid model JSON output is marked for repair pass", () => {
  assert.equal(shouldAttemptJsonRepair("```json\n{bad}\n```"), true);
  assert.equal(shouldAttemptJsonRepair("{\"ok\":true}"), false);
});

test("confirmation conflict is detected when selected option is missing", () => {
  const options = [{ id: "f1" }, { id: "f2" }];
  assert.equal(isConfirmationConflict(options, "f3"), true);
  assert.equal(isConfirmationConflict(options, "f2"), false);
});
