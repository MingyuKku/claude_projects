import { EXPIRED_ERROR_MESSAGES } from "../model/constants";
import { expiredPasswordErrorSchema } from "../model/schema";

/** Translates the failure reason the server sends into user-facing copy. */
export function mapExpiredError(reason?: string): string {
  if (reason === "contains personal info") {
    return EXPIRED_ERROR_MESSAGES.containsPersonalInfo;
  }
  if (reason === "NEW PASSWORD AND CHECK PASSWORD CAN NOT BE DIFFERENCE.") {
    return EXPIRED_ERROR_MESSAGES.passwordsDiffer;
  }
  if (reason === "NOT REACHED SEMI ANNUAL.") {
    return EXPIRED_ERROR_MESSAGES.notReachedSemiAnnual;
  }
  if (reason === "NEW PASSWORD CAN NOT BE SAME ORIGINAL PASSWORD.") {
    return EXPIRED_ERROR_MESSAGES.sameAsOriginal;
  }
  if (reason === "ORIGINAL PASSWORD INVALID.") {
    return EXPIRED_ERROR_MESSAGES.originalInvalid;
  }
  return EXPIRED_ERROR_MESSAGES.fallback;
}

/** Error bodies are untyped; anything that is not `{ reason: string }` yields undefined. */
export function readExpiredErrorReason(data: unknown): string | undefined {
  const parsed = expiredPasswordErrorSchema.safeParse(data);
  return parsed.success ? parsed.data.reason : undefined;
}
