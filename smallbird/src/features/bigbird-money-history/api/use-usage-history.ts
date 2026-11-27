import useSWR from "swr";

import { MEDIA_QUERY } from "@/shared/config";
import { useInfinitePages, useListSync, useMediaQuery } from "@/shared/lib";

import { useKeepDetail } from "../lib/use-keep-detail";
import { useUsageListParams } from "../lib/use-usage-list-params";
import { fetchUsageList } from "./usage-api";
import { USAGE_SYNC } from "./use-history-sync";

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

function useUsageScrollPages(
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
 * 사용 내역을 쪽 나눔 없이 이어 읽는 스크롤 목록(MO). 조건이 바뀌면 처음부터 다시 읽음.
 * 캐시가 있으면 다시 보일 때 읽지 않고, 빅버드 머니 화면에 다시 들어왔을 때만 읽어 둔 쪽을 모두 다시 읽음(`useListSync`).
 * 충전·운영자 출금처럼 이 앱 밖에서도 내역이 생겨 바뀐 것만 골라 읽을 수 없음.
 */
export function useUsageScrollList(
  baseQuery: UsageBaseQuery,
  isEnabled: boolean,
) {
  const list = useUsageScrollPages(baseQuery, isEnabled);
  useListSync(USAGE_SYNC, JSON.stringify(baseQuery), {
    isEnabled,
    hasData: list.hasData,
    reload: list.reload,
  });
  return list;
}

/**
 * 상세 보기로 연 사용 내역 한 건. 상세 조회 API가 없어 지금 보이는 목록
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
  // 목록의 다시 읽기(`useListSync`)는 목록이 맡고, 상세는 캐시만 씀.
  const scroll = useUsageScrollPages(baseQuery, isReady && !isTabletUp, {
    revalidateIfStale: false,
  });
  const records = isTabletUp ? (paged.list?.records ?? []) : scroll.records;
  const found =
    id === null ? null : (records.find((record) => record.id === id) ?? null);
  return useKeepDetail(id, found);
}
