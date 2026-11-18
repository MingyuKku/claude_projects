import { z } from "zod";

import { isApiError } from "@/shared/api";

const reasonSchema = z.object({ reason: z.string() });
const messageSchema = z.object({ message: z.string() });

/** `reason` of a failed response body, or undefined for non-API errors and other shapes. */
export function readApiErrorReason(error: unknown) {
  if (!isApiError(error)) return undefined;
  const parsed = reasonSchema.safeParse(error.data);
  return parsed.success ? parsed.data.reason : undefined;
}

export function readApiErrorMessage(error: unknown) {
  if (!isApiError(error)) return "";
  const parsed = messageSchema.safeParse(error.data);
  return parsed.success ? parsed.data.message : "";
}
