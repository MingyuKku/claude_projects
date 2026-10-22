import { changePasswordErrorSchema } from "../model/schema";

import type { ChangeSubmitErrorCode } from "../model/schema";

/** 서버가 보내는 실패 사유를 번역 키로 바꿈. */
export function mapChangeError(message?: string): ChangeSubmitErrorCode {
  if (message === "contains id") return "containsId";
  if (message === "contains personal info") return "containsPersonalInfo";
  if (message === "time out") return "timeOut";
  return "fallback";
}

/** 에러 본문은 타입이 없어서 `{ message: string }`이 아니면 undefined를 돌려줌. */
export function readChangeErrorMessage(data: unknown): string | undefined {
  const parsed = changePasswordErrorSchema.safeParse(data);
  return parsed.success ? parsed.data.message : undefined;
}
