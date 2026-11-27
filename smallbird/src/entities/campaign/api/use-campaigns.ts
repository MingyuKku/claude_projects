import { useEffect, useEffectEvent } from "react";
import useSWR, { useSWRConfig } from "swr";

import { useInfinitePages } from "@/shared/lib";

import { takePendingCampaignChanges } from "../model/list-changes";
import { fetchCampaigns } from "./campaign-api";

import type { CampaignListQuery, CampaignSummary } from "../model/types";

const CAMPAIGNS_KEY = ["campaign", "list"] as const;
/** MO 스크롤 목록의 쪽 번호를 뺀 키 앞부분. 쪽 나눔 목록의 키와 겹치지 않게 다른 이름을 씀. */
const CAMPAIGNS_SCROLL_KEY = ["campaign", "list-scroll"] as const;

type CampaignBaseQuery = Omit<CampaignListQuery, "page">;

function includesAny(
  records: readonly CampaignSummary[],
  campaignIdxs: ReadonlySet<number>,
) {
  return records.some((record) => campaignIdxs.has(record.campaignIdx));
}

/**
 * 현황 목록 한 쪽. 쪽을 넘기는 동안에는 이전 쪽을 보여 깜빡이지 않게 함. `null`이면 읽지 않음.
 * 보이는 쪽이 하나라 다시 읽어도 쪽 경계가 어긋나지 않아, 다시 보일 때마다 그 쪽을 다시 읽음(SWR 기본값, 다른 곳의 변경도 반영).
 */
export function useCampaignPage(query: CampaignListQuery | null) {
  const { data, error, isLoading, mutate } = useSWR(
    query === null ? null : [...CAMPAIGNS_KEY, query],
    () => fetchCampaigns(query as CampaignListQuery),
    { keepPreviousData: true },
  );
  return { list: data, isLoading, isError: Boolean(error), mutate };
}

/**
 * 현황 목록을 쪽 나눔 없이 이어 읽는 스크롤 목록. 조건이 바뀌면 처음부터 다시 읽음.
 * 캐시가 있으면 다시 보일 때 읽지 않음. 이 앱에서 캠페인을 바꿨으면 내용만 바뀐 캠페인은 그 캠페인이 있는 쪽만, 목록 구성이 바뀌었으면
 * 쪽 경계가 밀렸을 수 있어 읽어 둔 쪽을 모두 다시 읽음. 검색 중이면 이름이 바뀌어 검색 결과에서 빠질 수 있어 모두 다시 읽음.
 */
export function useCampaignScrollList(baseQuery: CampaignBaseQuery) {
  const list = useInfinitePages(
    [...CAMPAIGNS_SCROLL_KEY, baseQuery],
    (page) => fetchCampaigns({ ...baseQuery, page }),
    { revalidateFirstPage: false },
  );
  const listKey = JSON.stringify(baseQuery);
  const { hasData } = list;

  const syncChanges = useEffectEvent((key: string) => {
    const pending = takePendingCampaignChanges(key);
    if (!pending) return;
    const { campaignIdxs } = pending;
    if (pending.isStructural || (baseQuery.keyword && campaignIdxs.size > 0)) {
      void list.reload();
      return;
    }
    if (includesAny(list.records, campaignIdxs)) {
      void list.revalidatePages((page) =>
        includesAny(page.records, campaignIdxs),
      );
    }
  });
  useEffect(() => {
    if (hasData) syncChanges(listKey);
  }, [listKey, hasData]);

  // 직접 다시 읽으면 그때까지의 변경은 반영되므로, 다음에 다시 보일 때 또 읽지 않게 함.
  function reload() {
    takePendingCampaignChanges(listKey);
    return list.reload();
  }

  return { ...list, reload };
}

/**
 * 캠페인을 지운 뒤 지금 그려진 쪽 나눔 목록을 다시 읽게 함. 이어 읽는 목록은 다시 보일 때 변경 기록으로 맞추고
 * (`takePendingCampaignChanges`), 지금 보이는 목록은 호출하는 쪽이 `reload`로 읽음.
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
