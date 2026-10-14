import { CHANGE_ERROR_MESSAGES } from "../model/constants";
import { changePasswordErrorSchema } from "../model/schema";

/** Translates the failure reason the server sends into user-facing copy. */
export function mapChangeError(message?: string): string {
  if (message === "contains id") return CHANGE_ERROR_MESSAGES.containsId;
  if (message === "contains personal info") {
    return CHANGE_ERROR_MESSAGES.containsPersonalInfo;
  }
  if (message === "time out") return CHANGE_ERROR_MESSAGES.timeOut;
  return CHANGE_ERROR_MESSAGES.fallback;
}

/** Error bodies are untyped; anything that is not `{ message: string }` yields undefined. */
export function readChangeErrorMessage(data: unknown): string | undefined {
  const parsed = changePasswordErrorSchema.safeParse(data);
  return parsed.success ? parsed.data.message : undefined;
}
