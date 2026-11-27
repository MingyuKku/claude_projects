// 상품 목록·구독 목록·카드·결제 내역은 실제 API이고, 이용요약만 API가 아직 없어 개발 서버의 목 데이터를 돌려줌.
// 이용요약 API가 공개되는 대로 SWR 훅으로 바꾸고 model/mock.ts를 지움.
import useSWR, { useSWRConfig } from "swr";

import {
  markListsStale,
  useInfinitePages,
  useListSync,
  useMarkListsStaleOnLeave,
} from "@/shared/lib";

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

interface LoginOnlyQueryOptions {
  /** false면 요청하지 않음. 비로그인이 보는 구독 화면은 로그인 전용 API(구독·카드)를 부르지 않음. */
  isEnabled?: boolean;
}

/**
 * 구독 중인 상품들(해지 예정 포함). 구독 탭·결제 화면 진입 확인·결제내역·이용요약이 같은 키를 읽어 한 번만 요청함.
 * 해지·결제 뒤에는 `mutate()`로 다시 읽음.
 */
export function useSubscriptions({
  isEnabled = true,
  revalidateIfStale = true,
}: LoginOnlyQueryOptions & {
  /** false면 캐시가 있을 때 화면에 들어와도 다시 읽지 않음(구독 상태를 눌렀을 때만 확인하는 화면). */
  revalidateIfStale?: boolean;
} = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? SUBSCRIPTIONS_KEY : null,
    fetchSubscriptions,
    { revalidateIfStale },
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
export function useBillingCards({
  isEnabled = true,
}: LoginOnlyQueryOptions = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? BILLING_CARDS_KEY : null,
    fetchBillingCards,
  );
  return { data, isLoading, isError: Boolean(error), mutate };
}

export const PAYMENTS_KEY = ["mypage", "subscription", "payments"];

/**
 * 구독 결제 내역 한 쪽(서버 쪽 나누기·필터, PC·TAB). 쪽·필터를 넘기는 동안에는 이전 결과를 그대로 보여 깜빡이지 않게 함.
 * `null`이면 읽지 않음(MO 스크롤 목록을 쓰는 동안).
 */
export function usePaymentRecords(query: PaymentQuery | null) {
  const { data, error, isLoading, mutate } = useSWR(
    query === null ? null : [...PAYMENTS_KEY, query],
    () => fetchSubscriptionPayments(query as PaymentQuery),
    { keepPreviousData: true },
  );
  return { data, isLoading, isError: Boolean(error), mutate };
}

/** MO 스크롤 목록의 쪽 번호를 뺀 키 앞부분. 쪽 나눔 목록의 키(`PAYMENTS_KEY`)와 겹치지 않게 다른 이름을 씀. */
const PAYMENTS_SCROLL_KEY = ["mypage", "subscription", "payments-scroll"];
/** MO 스크롤 목록의 버전 이름(`shared/lib` `useListSync`). */
const PAYMENTS_SYNC = "subscription-payments";

/**
 * 구독 결제 내역을 쪽 나눔 없이 이어 읽는 스크롤 목록(MO). 조건이 바뀌면 처음부터 다시 읽음.
 * 자동 갱신 결제처럼 이 앱 밖에서도 내역이 생겨, 캐시가 있으면 다시 보일 때 읽지 않고 구독 화면에 다시 들어왔을 때와
 * 구독 결과를 받았을 때만 읽어 둔 쪽을 모두 다시 읽음.
 */
export function usePaymentScrollList(
  baseQuery: Omit<PaymentQuery, "page">,
  isEnabled: boolean,
) {
  const list = useInfinitePages(
    [...PAYMENTS_SCROLL_KEY, baseQuery],
    async (page) => {
      const result = await fetchSubscriptionPayments({ ...baseQuery, page });
      // 응답에 전체 쪽 수가 없어 건수로 셈.
      return {
        ...result,
        totalPages: Math.ceil(result.totalCount / baseQuery.size),
      };
    },
    { isEnabled },
  );
  useListSync(PAYMENTS_SYNC, JSON.stringify(baseQuery), {
    isEnabled,
    hasData: list.hasData,
    reload: list.reload,
  });
  return list;
}

/** 구독 화면을 떠날 때 MO 결제 내역을 낡았다고 표시해, 다시 들어오면 한 번 다시 읽게 함. */
export function useRevalidatePaymentsOnReturn() {
  useMarkListsStaleOnLeave(PAYMENTS_SYNC);
}

/**
 * 구독 시작 결과가 돌아왔을 때 구독 목록·카드·결제 내역을 다시 읽음. MO 결제 내역은 전역 `mutate`로 이어 읽은 쪽을
 * 다시 읽지 못해 낡았다고 표시함(보이지 않으면 다음에 보일 때 읽음).
 */
export function useRevalidateSubscriptionData() {
  const { mutate } = useSWRConfig();
  return () => {
    markListsStale(PAYMENTS_SYNC);
    return mutate(
      (key) =>
        Array.isArray(key) && key[0] === "mypage" && key[1] === "subscription",
    );
  };
}
