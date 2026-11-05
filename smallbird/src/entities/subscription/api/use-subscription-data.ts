// 상품 목록·구독 목록·카드·결제 내역은 실제 API이고, 이용요약만 API가 아직 없어(스펙 §7 B-1) 개발 서버의 목 데이터를 돌려줌.
// 이용요약 API가 공개되는 대로 SWR 훅으로 바꾸고 model/mock.ts를 지움.
import useSWR, { useSWRConfig } from "swr";

import { getMockUsageSeries, getMockUsageSummary } from "../model/mock";
import {
  fetchBillingCards,
  fetchSubscriptionPayments,
  fetchSubscriptionPlans,
  fetchSubscriptions,
} from "./subscription-api";

import type { ActiveProductType } from "../model/codes";
import type {
  PaymentQuery,
  UsageSeriesPoint,
  UsageSeriesQuery,
  UsageSummary,
} from "../model/types";

interface QueryResult<T> {
  data: T;
  isLoading: false;
  isError: false;
}

function ready<T>(data: T): QueryResult<T> {
  return { data, isLoading: false, isError: false };
}

export const SUBSCRIPTION_PLANS_KEY = ["mypage", "subscription", "plans"];

/** 구독 상품 목록(월·연 요금, 할인율). 구독 탭과 결제 화면이 같은 키를 읽어 한 번만 요청함. */
export function useSubscriptionPlans() {
  const { data, error, isLoading, mutate } = useSWR(
    SUBSCRIPTION_PLANS_KEY,
    fetchSubscriptionPlans,
  );
  return { data, isLoading, isError: Boolean(error), mutate };
}

export const SUBSCRIPTIONS_KEY = ["mypage", "subscription", "subscriptions"];

/**
 * 구독 중인 상품들(해지 예정 포함). 구독 탭·결제 화면 진입 확인·결제내역·이용요약이 같은 키를 읽어 한 번만 요청함.
 * 해지·결제 뒤에는 `mutate()`로 다시 읽음.
 */
export function useSubscriptions() {
  const { data, error, isLoading, mutate } = useSWR(
    SUBSCRIPTIONS_KEY,
    fetchSubscriptions,
  );
  return { data, isLoading, isError: Boolean(error), mutate };
}

/** 한 상품의 이용 요약(검색·제안 한도와 브랜드형·공구형 누적). 구독하지 않았으면 `isSubscribed: false`. */
export function useUsageSummary(
  type: ActiveProductType,
): QueryResult<UsageSummary> {
  return ready(getMockUsageSummary(type));
}

/** 월별·일별 이용 시계열. */
export function useUsageSeries(
  query: UsageSeriesQuery,
): QueryResult<UsageSeriesPoint[]> {
  return ready(getMockUsageSeries(query));
}

export const BILLING_CARDS_KEY = ["mypage", "subscription", "billing-cards"];

/** 정기결제 카드(최대 2장). 삭제·기본 카드 변경은 `mutate`의 낙관적 갱신으로 반영함. */
export function useBillingCards() {
  const { data, error, isLoading, mutate } = useSWR(
    BILLING_CARDS_KEY,
    fetchBillingCards,
  );
  return { data, isLoading, isError: Boolean(error), mutate };
}

export const PAYMENTS_KEY = ["mypage", "subscription", "payments"];

/** 구독 결제 내역 한 쪽(서버 쪽 나누기·필터). 쪽·필터를 넘기는 동안에는 이전 결과를 그대로 보여 깜빡이지 않게 함. */
export function usePaymentRecords(query: PaymentQuery) {
  const { data, error, isLoading, mutate } = useSWR(
    [...PAYMENTS_KEY, query],
    () => fetchSubscriptionPayments(query),
    { keepPreviousData: true },
  );
  return { data, isLoading, isError: Boolean(error), mutate };
}

/** 구독 시작 결과가 돌아왔을 때 구독 목록·카드·결제 내역을 다시 읽음. */
export function useRevalidateSubscriptionData() {
  const { mutate } = useSWRConfig();
  return () =>
    mutate(
      (key) =>
        Array.isArray(key) && key[0] === "mypage" && key[1] === "subscription",
    );
}
