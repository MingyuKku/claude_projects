/**
 * 구독 시작 에러 코드(결제 서버 `reason`, 스펙 §7 백엔드)와 번역 키. 목록에 없는 코드는 일반 오류 문구로 보여 줌.
 * `INVALID_TOKEN`·`INVALID_REQUEST`·`INTERNAL_ERROR`는 사용자가 할 수 있는 일이 없어 일반 문구.
 */
const ISSUANCE_ERROR_KEYS = {
  NO_BILLING_CARD: "error.noBillingCard",
  ALREADY_SUBSCRIBED: "error.alreadySubscribed",
  PRODUCT_NOT_AVAILABLE: "error.productNotAvailable",
  CARD_LIMIT_EXCEEDED: "error.cardLimitExceeded",
  CARD_REGISTER_FAILED: "error.cardRegisterFailed",
  PAYMENT_FAILED: "error.paymentFailed",
} as const;

export type IssuanceErrorKey =
  (typeof ISSUANCE_ERROR_KEYS)[keyof typeof ISSUANCE_ERROR_KEYS];

export function toIssuanceErrorKey(
  reason: string | null | undefined,
): IssuanceErrorKey | null {
  if (!reason) return null;
  return Object.hasOwn(ISSUANCE_ERROR_KEYS, reason)
    ? ISSUANCE_ERROR_KEYS[reason as keyof typeof ISSUANCE_ERROR_KEYS]
    : null;
}
