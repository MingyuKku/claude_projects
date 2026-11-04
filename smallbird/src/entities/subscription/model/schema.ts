import { z } from "zod";

import { SUBSCRIPTION_PRODUCT_TYPES } from "./codes";

/** `GET /v3/mypage/subscription/plans` 응답. */
export const subscriptionPlanListSchema = z.object({
  /** 연간 결제 할인율(%). 구독 가능한 상품이 없으면 0. */
  yearlyDiscountRate: z.number(),
  /** 화면 카드 순서. 상품이 늘어날 수 있어 배열. */
  plans: z
    .array(
      z.object({
        productType: z.string(),
        isAvailable: z.boolean(),
        monthlyPrice: z.number(),
        yearlyPrice: z.number(),
      }),
    )
    .default([]),
});

export type SubscriptionPlanListResponse = z.infer<
  typeof subscriptionPlanListSchema
>;

export function isSubscriptionProductType(
  value: string,
): value is (typeof SUBSCRIPTION_PRODUCT_TYPES)[number] {
  return SUBSCRIPTION_PRODUCT_TYPES.some((type) => type === value);
}

/** `GET /v3/mypage/subscription/subscriptions` 응답. 이용 중인 구독(해지 예정 포함)의 배열. */
export const subscriptionListSchema = z.array(
  z.object({
    id: z.string(),
    productType: z.string(),
    productName: z.string(),
    startedAt: z.string(),
    endsAt: z.string(),
    amount: z.number(),
    paymentMethod: z.string(),
    /** 가장 최근 결제에 쓴 카드의 종류(`credit`·`debit`). 결제 기록이 없거나 기프트카드면 null. 모르는 값도 읽도록 문자열로 받음. */
    cardKind: z.string().nullish(),
    isCancelScheduled: z.boolean(),
    /** 구독 상태(`active`·`cancelScheduled`·`paymentFailed`). 모르는 값도 읽도록 문자열로 받고, 없으면 `isCancelScheduled`로 가림. */
    status: z.string().nullish(),
    /** 다음 재결제 날짜(`YYYY-MM-DD`, KST). `status`가 `paymentFailed`일 때만 있고 그 외 null. */
    nextRetryAt: z.string().nullish(),
  }),
);

export type SubscriptionListResponse = z.infer<typeof subscriptionListSchema>;

/** `GET /v3/mypage/subscription/billing-cards` 응답. 정기결제 카드(최대 2장). */
export const billingCardListSchema = z.array(
  z.object({
    id: z.string(),
    issuer: z.string(),
    /** 결제사가 앞 6자리·끝 1자리만 줘서 `1234-56**-****-***7` 모양. 그대로 표시. */
    maskedNumber: z.string(),
    isDefault: z.boolean(),
    /** 카드 등록 때 결제사가 준 카드 종류. */
    cardKind: z.string().nullish(),
  }),
);

export type BillingCardListResponse = z.infer<typeof billingCardListSchema>;

/** `GET /v3/mypage/subscription/payments` 응답. 쪽 나누기·필터는 서버가 함. */
export const subscriptionPaymentListSchema = z.object({
  totalCount: z.number(),
  items: z
    .array(
      z.object({
        id: z.string(),
        paidAt: z.string(),
        name: z.string(),
        amount: z.number(),
        // 모르는 코드가 와도 목록이 깨지지 않게 문자열로 읽음. 표시는 `usePaymentMethodLabel`·`PaymentStatusBadge`가 코드면 번역, 아니면 서버 값 그대로.
        method: z.string(),
        /** 결제 때 승인 응답의 카드 종류. 카드를 지워도 남음. */
        cardKind: z.string().nullish(),
        status: z.string(),
        receiptUrl: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export type SubscriptionPaymentListResponse = z.infer<
  typeof subscriptionPaymentListSchema
>;

/** `POST /v3/mypage/subscription/subscriptions/{id}/cancel` 응답. */
export const subscriptionCancelSchema = z.object({
  subscriptionId: z.string(),
  productType: z.string(),
  canceledAt: z.string(),
  /** 이 날(`YYYY-MM-DD`, KST)까지는 해지 예정으로 이용. */
  serviceEndAt: z.string(),
});

export type SubscriptionCancelResponse = z.infer<
  typeof subscriptionCancelSchema
>;

/** `GET /v3/mypage/subscription/init` 응답. 구독 시작 토큰(10분 유효). */
export const subscriptionInitSchema = z.object({ token: z.string() });

/**
 * 결제 서버 `POST /v3/subscription/billing/subscribe/new-card`(카드 추가는 `cards/register`) 응답. 결제창 주소(`issuanceUrl`)와, 그 주소로 POST할 값들(서명 포함).
 * 값 목록은 서버가 정하고 바뀔 수 있어 `issuanceUrl`만 검증하고 나머지는 이름 그대로 form에 실음(확정 전, 스펙 §7 B-1).
 */
export const subscriptionIssuanceSchema = z
  .object({ issuanceUrl: z.string().min(1) })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]));

export type SubscriptionIssuanceResponse = z.infer<
  typeof subscriptionIssuanceSchema
>;

/** 결제 서버 `POST /v3/subscription/billing/subscribe/saved-card` 응답. 기본 카드로 결제가 끝난 구독. 화면은 구독 목록을 다시 읽으므로 식별값만 검증함. */
export const savedCardSubscriptionSchema = z.object({
  subscriptionId: z.union([z.string(), z.number()]).transform(String),
});
