export function hasLowConfidenceResearch(research) {
  const flightCount = Array.isArray(research?.flightOptions) ? research.flightOptions.length : 0;
  const hotelCount = Array.isArray(research?.hotelOptions) ? research.hotelOptions.length : 0;
  const carCount = Array.isArray(research?.carRentalOptions) ? research.carRentalOptions.length : 0;
  return flightCount === 0 || hotelCount === 0 || carCount === 0;
}

export function shouldRetryAgentError(error, attempt, maxAttempts = 2) {
  if (attempt >= maxAttempts) return false;
  const normalizedCode = String(error?.code || error?.type || "").toLowerCase();
  const statusCode = Number(error?.status || error?.statusCode || error?.cause?.status || 0);
  const message = String(error?.message || error?.cause?.message || "").toLowerCase();

  if (statusCode === 429 || statusCode === 408) return true;
  if (statusCode >= 500 && statusCode <= 599) return true;

  if (
    normalizedCode.includes("etimedout") ||
    normalizedCode.includes("econnreset") ||
    normalizedCode.includes("eai_again") ||
    normalizedCode.includes("rate_limit")
  ) {
    return true;
  }

  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("408") ||
    message.includes("429") ||
    message.includes("5xx") ||
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
