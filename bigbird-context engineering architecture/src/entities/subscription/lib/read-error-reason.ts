import { z } from "zod";

import { isApiError } from "@/shared/api";

const reasonSchema = z.object({ reason: z.string() });

/** 실패 응답 본문 `{ result: false, reason }`의 `reason`(에러 코드). API 오류가 아니거나 모양이 다르면 undefined. */
export function readApiErrorReason(error: unknown) {
  if (!isApiError(error)) return undefined;
  const parsed = reasonSchema.safeParse(error.data);
  return parsed.success ? parsed.data.reason : undefined;
}
