import { z } from "zod";

import { isApiError } from "@/shared/api";

const reasonSchema = z.object({ reason: z.string() });
// 결제사(PG)가 거절 사유를 준 경우에만 옴. 비어 있으면 없는 것으로 봄.
const pgMessageSchema = z.object({ pgMessage: z.string().trim().min(1) });

/** 실패 응답 본문 `{ result: false, reason }`의 `reason`(에러 코드). API 오류가 아니거나 모양이 다르면 undefined. */
export function readApiErrorReason(error: unknown) {
  if (!isApiError(error)) return undefined;
  const parsed = reasonSchema.safeParse(error.data);
  return parsed.success ? parsed.data.reason : undefined;
}

/**
 * 결제 실패 응답 본문의 `pgMessage`(이니시스가 준 거절 사유, 예: "잔액부족"). 없거나 비어 있으면 undefined.
 * 한국어 원문이라 번역하지 않고 그대로 보여 줌(스펙 §3 결제).
 */
export function readApiErrorPgMessage(error: unknown) {
  if (!isApiError(error)) return undefined;
  const parsed = pgMessageSchema.safeParse(error.data);
  return parsed.success ? parsed.data.pgMessage : undefined;
}
