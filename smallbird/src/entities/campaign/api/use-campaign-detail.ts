import useSWR from "swr";

import { fillLoaderCache } from "@/shared/lib";

import { fetchCampaignDetail } from "./campaign-detail-api";

export function campaignDetailKey(campaignIdx: number) {
  return ["campaign", "detail", campaignIdx] as const;
}

/** 화면 진입을 정하는 route loader용. 읽은 상세를 화면의 캐시에 넣어 화면이 같은 값으로 그려지게 함. */
export async function loadCampaignDetail(campaignIdx: number) {
  const detail = await fetchCampaignDetail(campaignIdx);
  await fillLoaderCache(campaignDetailKey(campaignIdx), detail);
  return detail;
}

interface UseCampaignDetailOptions {
  /** 진입 loader(`loadCampaignDetail`)가 방금 캐시를 채운 화면이면 true. 마운트 때 다시 읽지 않음. */
  isFilledByLoader?: boolean;
}

/** 캠페인 상세(A-3). `null`이면 읽지 않음. 요청 중복 방지를 끈 이유는 스펙 register §5. */
export function useCampaignDetail(
  campaignIdx: number | null,
  { isFilledByLoader = false }: UseCampaignDetailOptions = {},
) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignIdx === null ? null : campaignDetailKey(campaignIdx),
    ([, , idx]) => fetchCampaignDetail(idx),
    { dedupingInterval: 0, revalidateIfStale: !isFilledByLoader },
  );
  return { detail: data, error, isLoading, mutate };
}
