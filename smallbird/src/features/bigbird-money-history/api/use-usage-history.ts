import useSWR from "swr";

import { MEDIA_QUERY } from "@/shared/config";
import { useInfinitePages, useMediaQuery } from "@/shared/lib";

import { useUsageListParams } from "../lib/use-usage-list-params";
import { fetchUsageList } from "./usage-api";

import type { UsageQuery } from "../model/usage-types";

const USAGE_KEY = ["mypage", "bigbird-money", "usage"];
/** MO 스크롤 목록의 쪽 번호를 뺀 키 앞부분. 쪽 나눔 목록의 키(`USAGE_KEY`)와 겹치지 않게 다른 이름을 씀. */
const USAGE_SCROLL_KEY = ["mypage", "bigbird-money", "usage-scroll"];

type UsageBaseQuery = Omit<UsageQuery, "page">;

/** 사용 내역 한 쪽(PC·TAB). 쪽을 넘기는 동안에는 이전 쪽을 그대로 보여 깜빡이지 않게 함. `null`이면 읽지 않음. */
export function useUsageHistory(
  query: UsageQuery | null,
  { revalidateIfStale = true }: { revalidateIfStale?: boolean } = {},
) {
  const { data, error, isLoading, mutate } = useSWR(
    query === null ? null : [...USAGE_KEY, query],
    () => fetchUsageList(query as UsageQuery),
    { keepPreviousData: true, revalidateIfStale },
  );
  return { list: data, isLoading, isError: Boolean(error), mutate };
}

/** 사용 내역을 쪽 나눔 없이 이어 읽는 스크롤 목록(MO). 조건이 바뀌면 처음부터 다시 읽음. */
export function useUsageScrollList(
  baseQuery: UsageBaseQuery,
  isEnabled: boolean,
  { revalidateIfStale = true }: { revalidateIfStale?: boolean } = {},
) {
  return useInfinitePages(
    [...USAGE_SCROLL_KEY, baseQuery],
    (page) => fetchUsageList({ ...baseQuery, page }),
    { isEnabled, revalidateIfStale },
  );
}

/**
 * 상세 보기로 연 사용 내역 한 건. 상세 조회 API가 없어(API 명세 A-5, 만들지 않기로 결정) 지금 보이는 목록
 * (PC·TAB은 주소의 쪽, MO는 이어 읽은 목록)에서 찾음. 목록에 없으면 null이라 호출하는 쪽이 열지 않음.
 * 목록이 이미 읽어 둔 캐시를 그대로 쓰므로 상세를 열 때 같은 요청을 다시 보내지 않음(캐시가 없을 때, 예: 주소로 바로 열 때만 읽음).
 */
export function useUsageRecord(id: string | null) {
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const { params, baseQuery, isOptionsPending } = useUsageListParams();
  const isReady = id !== null && !isOptionsPending;
  const paged = useUsageHistory(
    isReady && isTabletUp ? { ...baseQuery, page: params.page } : null,
    { revalidateIfStale: false },
  );
  const scroll = useUsageScrollList(baseQuery, isReady && !isTabletUp, {
    revalidateIfStale: false,
  });
  if (id === null) return null;
  const records = isTabletUp ? (paged.list?.records ?? []) : scroll.records;
  return records.find((record) => record.id === id) ?? null;
}
