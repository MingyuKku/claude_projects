import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";

import {
  infinitePagesCacheKey,
  useInfinitePages,
  useMediaQuery,
} from "@/shared/lib";

import { useChargeListParams } from "../lib/use-charge-list-params";
import { TABLET_QUERY } from "../model/constants";
import { fetchChargeList } from "./charge-api";

import type { ChargeQuery } from "../model/charge-types";

const CHARGE_KEY = ["mypage", "bigbird-money", "charge"];
/** MO 스크롤 목록의 쪽 번호를 뺀 키 앞부분. 쪽 나눔 목록의 키(`CHARGE_KEY`)와 겹치지 않게 다른 이름을 씀. */
const CHARGE_SCROLL_KEY = ["mypage", "bigbird-money", "charge-scroll"];

type ChargeBaseQuery = Omit<ChargeQuery, "page">;

/** 충전/출금 내역 한 쪽(PC·TAB). 쪽을 넘기는 동안에는 이전 쪽을 그대로 보여 깜빡이지 않게 함. `null`이면 읽지 않음. */
export function useChargeHistory(
  query: ChargeQuery | null,
  { revalidateIfStale = true }: { revalidateIfStale?: boolean } = {},
) {
  const { data, error, isLoading, mutate } = useSWR(
    query === null ? null : [...CHARGE_KEY, query],
    () => fetchChargeList(query as ChargeQuery),
    { keepPreviousData: true, revalidateIfStale },
  );
  return { list: data, isLoading, isError: Boolean(error), mutate };
}

/** 충전/출금 내역을 쪽 나눔 없이 이어 읽는 스크롤 목록(MO). 조건이 바뀌면 처음부터 다시 읽음. */
export function useChargeScrollList(
  baseQuery: ChargeBaseQuery,
  isEnabled: boolean,
  { revalidateIfStale = true }: { revalidateIfStale?: boolean } = {},
) {
  return useInfinitePages(
    [...CHARGE_SCROLL_KEY, baseQuery],
    (page) => fetchChargeList({ ...baseQuery, page }),
    { isEnabled, revalidateIfStale },
  );
}

/**
 * 거래 상세로 연 충전/출금 내역 한 건. 상세 조회 API가 없어(API 명세 A-3, 만들지 않기로 결정) 지금 보이는 목록
 * (PC·TAB은 주소의 쪽, MO는 이어 읽은 목록)에서 찾음. 목록에 없으면 null이라 호출하는 쪽이 열지 않음.
 * 목록이 이미 읽어 둔 캐시를 그대로 쓰므로 상세를 열 때 같은 요청을 다시 보내지 않음(캐시가 없을 때, 예: 주소로 바로 열 때만 읽음).
 */
export function useChargeRecord(id: string | null) {
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const { params, baseQuery } = useChargeListParams();
  const paged = useChargeHistory(
    id !== null && isTabletUp ? { ...baseQuery, page: params.page } : null,
    { revalidateIfStale: false },
  );
  const scroll = useChargeScrollList(baseQuery, id !== null && !isTabletUp, {
    revalidateIfStale: false,
  });
  if (id === null) return null;
  const records = isTabletUp ? (paged.list?.records ?? []) : scroll.records;
  return records.find((record) => record.id === id) ?? null;
}

/**
 * 충전·출금 요청이 접수된 뒤 충전/출금 내역을 다시 읽음. 쪽 나눔 목록은 조건과 관계없이 모두, MO 스크롤 목록은 지금 조건의 것
 * (SWR의 키 골라 갱신은 스크롤 목록 키를 건너뛰어 지금 조건의 키를 직접 지정함).
 */
export function useReloadChargeHistory() {
  const { mutate } = useSWRConfig();
  const { baseQuery } = useChargeListParams();
  const scrollCacheKey = infinitePagesCacheKey([
    ...CHARGE_SCROLL_KEY,
    baseQuery,
  ]);
  return useCallback(
    () =>
      Promise.all([
        mutate(
          (key) =>
            Array.isArray(key) &&
            CHARGE_KEY.every((part, index) => key[index] === part),
        ),
        mutate(scrollCacheKey),
      ]),
    [mutate, scrollCacheKey],
  );
}
