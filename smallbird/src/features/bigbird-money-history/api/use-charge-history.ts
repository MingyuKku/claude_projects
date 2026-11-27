import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";

import { MEDIA_QUERY } from "@/shared/config";
import {
  markListsStale,
  useInfinitePages,
  useListSync,
  useMediaQuery,
} from "@/shared/lib";

import { useChargeListParams } from "../lib/use-charge-list-params";
import { useKeepDetail } from "../lib/use-keep-detail";
import { fetchChargeList } from "./charge-api";
import { CHARGE_SYNC } from "./use-history-sync";

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

function useChargeScrollPages(
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
 * 충전/출금 내역을 쪽 나눔 없이 이어 읽는 스크롤 목록(MO). 조건이 바뀌면 처음부터 다시 읽음.
 * 캐시가 있으면 다시 보일 때 읽지 않고, 빅버드 머니 화면에 다시 들어왔을 때와 `useReloadChargeHistory`를 불렀을 때
 * 읽어 둔 쪽을 모두 다시 읽음(`useListSync`). 입금·운영자 출금처럼 이 앱 밖에서 바뀌어 바뀐 것만 골라 읽을 수 없음.
 */
export function useChargeScrollList(
  baseQuery: ChargeBaseQuery,
  isEnabled: boolean,
) {
  const list = useChargeScrollPages(baseQuery, isEnabled);
  useListSync(CHARGE_SYNC, JSON.stringify(baseQuery), {
    isEnabled,
    hasData: list.hasData,
    reload: list.reload,
  });
  return list;
}

/**
 * 거래 상세로 연 충전/출금 내역 한 건. 상세 조회 API가 없어 지금 보이는 목록
 * (PC·TAB은 주소의 쪽, MO는 이어 읽은 목록)에서 찾음. 목록에 없으면 null이라 호출하는 쪽이 열지 않음.
 * 목록이 이미 읽어 둔 캐시를 그대로 쓰므로 상세를 열 때 같은 요청을 다시 보내지 않음(캐시가 없을 때, 예: 주소로 바로 열 때만 읽음).
 */
export function useChargeRecord(id: string | null) {
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const { params, baseQuery } = useChargeListParams();
  const paged = useChargeHistory(
    id !== null && isTabletUp ? { ...baseQuery, page: params.page } : null,
    { revalidateIfStale: false },
  );
  // 목록의 다시 읽기(`useListSync`)는 목록이 맡고, 상세는 캐시만 씀.
  const scroll = useChargeScrollPages(baseQuery, id !== null && !isTabletUp, {
    revalidateIfStale: false,
  });
  const records = isTabletUp ? (paged.list?.records ?? []) : scroll.records;
  const found =
    id === null ? null : (records.find((record) => record.id === id) ?? null);
  return useKeepDetail(id, found);
}

/**
 * 충전·출금 요청이 접수된 뒤 충전/출금 내역을 다시 읽음. 쪽 나눔 목록은 조건과 관계없이 모두 전역 `mutate`로 읽음.
 * MO 스크롤 목록은 전역 `mutate`로는 이어 읽은 쪽을 다시 읽지 못해, 낡았다고 표시해 보이는 목록이 읽어 둔 쪽을 모두 다시 읽게 함
 * (보이지 않는 조건의 목록은 다음에 보일 때).
 */
export function useReloadChargeHistory() {
  const { mutate } = useSWRConfig();
  return useCallback(() => {
    markListsStale(CHARGE_SYNC);
    return mutate(
      (key) =>
        Array.isArray(key) &&
        CHARGE_KEY.every((part, index) => key[index] === part),
    );
  }, [mutate]);
}
