import useSWR from "swr";

import { fetchCampaignDetail } from "./campaign-detail-api";

export function campaignDetailKey(campaignIdx: number) {
  return ["campaign", "detail", campaignIdx] as const;
}

/**
 * 캠페인 상세(A-3). `null`이면 읽지 않음. 저장·결제 뒤 이 키를 비우고 바로 화면을 옮기는 흐름이 있어, 직전 조회가
 * 2초 안에 끝났어도 새로 읽도록 요청 중복 방지를 끔(SWR 기본값이면 다시 읽지 않아 로딩에 멈춤).
 */
export function useCampaignDetail(campaignIdx: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignIdx === null ? null : campaignDetailKey(campaignIdx),
    ([, , idx]) => fetchCampaignDetail(idx),
    { dedupingInterval: 0 },
  );
  return { detail: data, error, isLoading, mutate };
}
