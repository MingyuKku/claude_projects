import { isApiError } from "@/shared/api";

import {
  resultWithReasonSchema,
  simpleResultSchema,
  v3ErrorSchema,
} from "../model/mypage-schema";

const HTTP_TOO_MANY_REQUESTS = 429;

/** 정산 기간 계좌 변경 거부. HTTP 200에 `result: true`로 오는 유일한 실패. */
export const DENIED_REASON = "denied";

/** 비 2xx 응답의 `V3ErrorResponse.reason`. 다른 오류나 다른 형태면 undefined. */
export function readFailureReason(error: unknown) {
  if (!isApiError(error)) return undefined;
  const parsed = v3ErrorSchema.safeParse(error.data);
  return parsed.success ? parsed.data.reason : undefined;
}

/** 비밀번호 변경 같은 5분 제한 API가 거부했는지. */
export function isTooManyRequests(error: unknown) {
  return isApiError(error) && error.status === HTTP_TOO_MANY_REQUESTS;
}

/**
 * 항상 HTTP 200으로 오는 업로드·계좌 응답의 실패 사유.
 * 성공이면 null, 실패면 `reason`(없으면 빈 문자열)을 돌려줌.
 * `{ result: true, reason: "denied" }`도 실패로 취급하므로 `result`만 보지 않음.
 */
export function readResultFailure(response: unknown) {
  const parsed = resultWithReasonSchema.safeParse(response);
  if (!parsed.success) return "";
  const { result, reason } = parsed.data;
  if (reason === DENIED_REASON) return DENIED_REASON;
  return result ? null : (reason ?? "");
}

/** `SimpleResultResponse`(`{ result }`)가 성공인지. 형태가 다르면 성공으로 보지 않음. */
export function isSimpleSuccess(response: unknown) {
  const parsed = simpleResultSchema.safeParse(response);
  return parsed.success && parsed.data.result;
}
