/** 구독 상품 유형. 라이브형·어플리에이터형은 "준비중"으로만 노출함. 코드 체계는 백엔드 확인(스펙 §7 B-2) 전 임시. */
export const SUBSCRIPTION_PRODUCT_TYPES = [
  "recruit",
  "pick",
  "live",
  "applicator",
] as const;
export type SubscriptionProductType =
  (typeof SUBSCRIPTION_PRODUCT_TYPES)[number];

/** 구독해서 쓸 수 있는 상품. 이용요약 세그먼트·결제 화면은 이 두 개만 다룸. */
export const ACTIVE_PRODUCT_TYPES = ["recruit", "pick"] as const;
export type ActiveProductType = (typeof ACTIVE_PRODUCT_TYPES)[number];

export function isActiveProductType(
  value: string | null,
): value is ActiveProductType {
  return ACTIVE_PRODUCT_TYPES.some((type) => type === value);
}

/** 결제 상태. 임시 코드(스펙 §5, B-2). */
export const PAYMENT_STATUSES = ["paid", "refunding", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** 결제 수단. 구독은 신용카드만(스펙 §3). 임시 코드(B-2). */
export const PAYMENT_METHODS = ["card", "cardInstallment"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** 결제 카드 종류. 서버 `cardKind`(`credit` 신용·`debit` 체크). 기프트카드·알 수 없음은 서버가 null로 줌. */
export const CARD_KINDS = ["credit", "debit"] as const;
export type CardKind = (typeof CARD_KINDS)[number];

/** 서버 값을 카드 종류 코드로 바꿈. 없거나 모르는 값은 null(종류를 가리지 않고 보임). */
export function toCardKind(
  serverValue: string | null | undefined,
): CardKind | null {
  return CARD_KINDS.find((kind) => kind === serverValue) ?? null;
}

/** 이용 현황 지표. 매칭 성사 수는 PICK형만. */
export const USAGE_METRICS = [
  "campaignCount",
  "searchCount",
  "proposalCount",
  "matchCount",
] as const;
export type UsageMetric = (typeof USAGE_METRICS)[number];

export const USAGE_METRICS_BY_TYPE: Record<
  ActiveProductType,
  readonly UsageMetric[]
> = {
  recruit: ["campaignCount", "searchCount", "proposalCount"],
  pick: ["campaignCount", "searchCount", "proposalCount", "matchCount"],
};

/** 서버 값을 결제 상태 코드로 바꿈. 목록에 없는 값은 null이라 호출하는 쪽이 서버 값을 그대로 보여 줌. */
export function toPaymentStatus(serverValue: string): PaymentStatus | null {
  return PAYMENT_STATUSES.find((status) => status === serverValue) ?? null;
}

/** 서버 값을 결제 수단 코드로 바꿈. 목록에 없는 값은 null. */
export function toPaymentMethod(serverValue: string): PaymentMethod | null {
  return PAYMENT_METHODS.find((method) => method === serverValue) ?? null;
}

/** 결제 주기. 구독 탭의 월간/연간 선택을 결제 화면까지 이어 줌. */
export const BILLING_PERIODS = ["monthly", "yearly"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export function isBillingPeriod(value: string | null): value is BillingPeriod {
  return BILLING_PERIODS.some((period) => period === value);
}
