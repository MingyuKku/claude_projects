import useSWR, { useSWRConfig } from "swr";

import { useInfinitePages } from "@/shared/lib";

import { fetchCampaigns } from "./campaign-api";

import type { CampaignListQuery } from "../model/types";

const CAMPAIGNS_KEY = ["campaign", "list"] as const;
/** MO 스크롤 목록의 쪽 번호를 뺀 키 앞부분. 쪽 나눔 목록의 키와 겹치지 않게 다른 이름을 씀. */
const CAMPAIGNS_SCROLL_KEY = ["campaign", "list-scroll"] as const;

type CampaignBaseQuery = Omit<CampaignListQuery, "page">;

/** 현황 목록 한 쪽(PC·TAB). 쪽을 넘기는 동안에는 이전 쪽을 보여 깜빡이지 않게 함. `null`이면 읽지 않음. */
export function useCampaignPage(query: CampaignListQuery | null) {
  const { data, error, isLoading, mutate } = useSWR(
    query === null ? null : [...CAMPAIGNS_KEY, query],
    () => fetchCampaigns(query as CampaignListQuery),
    { keepPreviousData: true },
  );
  return { list: data, isLoading, isError: Boolean(error), mutate };
}

/** 현황 목록을 쪽 나눔 없이 이어 읽는 스크롤 목록(MO). 조건이 바뀌면 처음부터 다시 읽음. */
export function useCampaignScrollList(
  baseQuery: CampaignBaseQuery,
  isEnabled: boolean,
) {
  return useInfinitePages(
    [...CAMPAIGNS_SCROLL_KEY, baseQuery],
    (page) => fetchCampaigns({ ...baseQuery, page }),
    { isEnabled },
  );
}

/**
 * 캠페인을 지운 뒤 모든 탭·쪽의 쪽 나눔 목록을 낡았다고 표시해 다시 읽게 함. 이어 읽는 목록(MO)의 캐시는 다시 열 때
 * 처음 쪽부터 다시 읽으므로 따로 건드리지 않고, 지금 보이는 목록은 호출하는 쪽이 `reload`로 읽음.
 */
export function useRevalidateCampaignList() {
  const { mutate } = useSWRConfig();

  return () =>
    mutate(
      (key) =>
        Array.isArray(key) &&
        key[0] === CAMPAIGNS_KEY[0] &&
        key[1] === CAMPAIGNS_KEY[1],
    );
}
