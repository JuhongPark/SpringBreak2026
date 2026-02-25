export function hasLowConfidenceResearch(research) {
  const flightCount = Array.isArray(research?.flightOptions) ? research.flightOptions.length : 0;
  const hotelCount = Array.isArray(research?.hotelOptions) ? research.hotelOptions.length : 0;
  const carCount = Array.isArray(research?.carRentalOptions) ? research.carRentalOptions.length : 0;
  return flightCount === 0 || hotelCount === 0 || carCount === 0;
}

export function shouldRetryAgentError(error, attempt, maxAttempts = 2) {
  if (attempt >= maxAttempts) return false;
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("rate limit") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("temporar")
  );
}

export function shouldAttemptJsonRepair(rawText) {
  if (typeof rawText !== "string") return false;
  const text = rawText.trim();
  if (!text) return false;
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    return false;
  }
  return true;
}

export function isConfirmationConflict(options, optionId) {
  if (!Array.isArray(options) || options.length === 0) return true;
  return !options.some((option) => option.id === optionId);
}
