import { expiredPasswordErrorSchema } from "../model/schema";

import type { ExpiredServerErrorCode } from "../model/schema";

/** Maps the failure reason the server sends to a translation key. */
export function mapExpiredError(reason?: string): ExpiredServerErrorCode {
  if (reason === "contains personal info") return "containsPersonalInfo";
  if (reason === "NEW PASSWORD AND CHECK PASSWORD CAN NOT BE DIFFERENCE.") {
    return "passwordsDiffer";
  }
  if (reason === "NOT REACHED SEMI ANNUAL.") return "notReachedSemiAnnual";
  if (reason === "NEW PASSWORD CAN NOT BE SAME ORIGINAL PASSWORD.") {
    return "sameAsOriginal";
  }
  if (reason === "ORIGINAL PASSWORD INVALID.") return "originalInvalid";
  return "fallback";
}

/** Error bodies are untyped; anything that is not `{ reason: string }` yields undefined. */
export function readExpiredErrorReason(data: unknown): string | undefined {
  const parsed = expiredPasswordErrorSchema.safeParse(data);
  return parsed.success ? parsed.data.reason : undefined;
}
