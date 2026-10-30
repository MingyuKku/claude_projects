import { payApi, serverApiV3 } from "@/shared/api";

import { buildIssuanceForm } from "../lib/build-issuance-form";
import { transformBillingCards } from "../lib/transform-billing-cards";
import { transformPayments } from "../lib/transform-payments";
import { transformPlans } from "../lib/transform-plans";
import { transformSubscriptions } from "../lib/transform-subscriptions";
import {
  billingCardListSchema,
  savedCardSubscriptionSchema,
  subscriptionCancelSchema,
  subscriptionInitSchema,
  subscriptionIssuanceSchema,
  subscriptionListSchema,
  subscriptionPaymentListSchema,
  subscriptionPlanListSchema,
} from "../model/schema";

import type { ActiveProductType, BillingPeriod } from "../model/codes";
import type {
  IssuanceForm,
  IssuancePaths,
  PaymentQuery,
  SubscriptionCancelResult,
} from "../model/types";

/** 결제 서버의 새 카드로 구독 시작(카드 등록 + 첫 결제) API. V3가 프록시하지 않아 프론트가 직접 부름. */
const NEW_CARD_PATH = "/v3/subscription/billing/subscribe/new-card";
/** 결제 서버의 등록된 카드로 구독 시작 API. 결제창 없이 기본 카드로 바로 결제함. */
const SAVED_CARD_PATH = "/v3/subscription/billing/subscribe/saved-card";
/** 결제 서버의 카드 추가(결제 없이 카드만 등록) API. 결제창 값은 새 카드로 구독 시작과 같은 모양. */
const CARD_REGISTER_PATH = "/v3/subscription/billing/cards/register";

/** `GET /v3/mypage/subscription/plans`. 구독 탭 상품 카드와 월·연 가격(MASTER/ADMIN만, Sub ID는 403). */
export async function fetchSubscriptionPlans() {
  const response = await serverApiV3.get("/mypage/subscription/plans");
  return transformPlans(subscriptionPlanListSchema.parse(response));
}

/** `GET /v3/mypage/subscription/subscriptions`. 이용 중인 구독 목록(해지 예정 포함, MASTER/ADMIN만, Sub ID는 403). */
export async function fetchSubscriptions() {
  const response = await serverApiV3.get("/mypage/subscription/subscriptions");
  return transformSubscriptions(subscriptionListSchema.parse(response));
}

/** `GET /v3/mypage/subscription/billing-cards`. 정기결제 카드(최대 2장, MASTER/ADMIN만). */
export async function fetchBillingCards() {
  const response = await serverApiV3.get("/mypage/subscription/billing-cards");
  return transformBillingCards(billingCardListSchema.parse(response));
}

/**
 * `DELETE /v3/mypage/subscription/billing-cards/{cardId}`. 결제 중인 구독이 있으면 기본 카드는 409 `DEFAULT_CARD_IN_USE`,
 * 없는·남의 카드는 404 `BILLING_CARD_NOT_FOUND`.
 */
export async function deleteBillingCard(cardId: string) {
  await serverApiV3.delete(`/mypage/subscription/billing-cards/${cardId}`);
}

/** `PUT /v3/mypage/subscription/billing-cards/{cardId}/default`. 다음 정기결제부터 이 카드로 결제됨. */
export async function setDefaultBillingCard(cardId: string) {
  await serverApiV3.put(`/mypage/subscription/billing-cards/${cardId}/default`);
}

/** `POST /v3/mypage/subscription/subscriptions/{id}/cancel`. 종료일까지 이용 후 끝남. 이미 해지면 409 `ALREADY_CANCELED`. */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<SubscriptionCancelResult> {
  const response = await serverApiV3.post(
    `/mypage/subscription/subscriptions/${subscriptionId}/cancel`,
  );
  const { serviceEndAt } = subscriptionCancelSchema.parse(response);
  return { subscriptionId, serviceEndAt };
}

/** `GET /v3/mypage/subscription/payments`. 성공한 구독 결제만 최신순, 쪽 나누기·필터는 서버가 함. */
export async function fetchSubscriptionPayments(query: PaymentQuery) {
  const response = await serverApiV3.get("/mypage/subscription/payments", {
    params: { ...query },
  });
  return transformPayments(subscriptionPaymentListSchema.parse(response));
}

/**
 * 새 카드로 구독 시작(기본 카드가 없을 때). 1) `GET /v3/mypage/subscription/init`으로 토큰(10분 유효)을 받고
 * 2) 결제 서버 `subscribe/new-card`에 상품·주기·`origin`·`redirectUri`를 보내 결제창 값을 받음. 결과를 받는 `returnUrl`은 서버가 정하므로 보내지 않음.
 * 복귀 도메인은 프론트가 `origin`으로 정하고 서버는 검증하지 않음. 금액·주문번호·서명은 서버가 만듦.
 * 실패하면 `{ result: false, reason }` 본문이 담긴 `ApiError`를 던짐.
 */
export async function requestSubscriptionIssuance(
  productType: ActiveProductType,
  billingPeriod: BillingPeriod,
  paths: IssuancePaths,
): Promise<IssuanceForm> {
  return postIssuance(NEW_CARD_PATH, { productType, billingPeriod }, paths);
}

/**
 * 등록된 카드로 구독 시작(기본 카드가 있을 때). 결제창 없이 서버가 기본 카드로 바로 결제하고 결과를 JSON으로 줌.
 * 실패는 400 `{ result: false, reason }`(`NO_BILLING_CARD`·`ALREADY_SUBSCRIBED`·`PAYMENT_FAILED` 등)이고 보조 카드로 재시도하지 않음.
 */
export async function requestSavedCardSubscription(
  productType: ActiveProductType,
  billingPeriod: BillingPeriod,
) {
  const { token } = await fetchInitToken();
  const response = await payApi.post(SAVED_CARD_PATH, {
    token,
    productType,
    billingPeriod,
  });
  return savedCardSubscriptionSchema.parse(response);
}

/**
 * 카드 추가. 구독·결제 없이 카드만 저장함(첫 카드면 기본 카드). 토큰은 구독 시작과 같은 `init`이고,
 * 결과는 `?result=success&cardId=…` 또는 `?result=fail&reason=코드`로 돌아옴. 카드가 2장이면 `CARD_LIMIT_EXCEEDED`.
 */
export async function requestCardIssuance(
  paths: IssuancePaths,
): Promise<IssuanceForm> {
  return postIssuance(CARD_REGISTER_PATH, {}, paths);
}

async function fetchInitToken() {
  return subscriptionInitSchema.parse(
    await serverApiV3.get("/mypage/subscription/init"),
  );
}

async function postIssuance(
  path: string,
  body: Record<string, string>,
  paths: IssuancePaths,
): Promise<IssuanceForm> {
  const { token } = await fetchInitToken();
  const response = await payApi.post(path, {
    token,
    ...body,
    origin: window.location.origin,
    ...paths,
  });
  return buildIssuanceForm(subscriptionIssuanceSchema.parse(response));
}
