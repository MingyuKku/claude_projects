import { useState } from "react";
import useSWR from "swr";

import { fetchCampaign, fetchCampaignDraft } from "./campaign-api";

import type { CampaignDraft } from "../model/schema";

export const campaignKey = (campaignIdx: number) =>
  ["campaign", campaignIdx] as const;
export const campaignDraftKey = (campaignIdx: number) =>
  ["campaign", campaignIdx, "draft"] as const;

/**
 * 등록 내역(승인 상태 포함). `campaignIdx`가 null이면 요청하지 않음.
 * 결제·승인 요청 취소·저장 뒤에는 이 캐시를 비워 다음에 새로 읽게 하는데, SWR의 요청 중복 방지(기본 2초)가 켜져 있으면
 * 직전 조회가 2초 안에 끝난 화면으로 돌아왔을 때 새 조회가 "방금 한 요청"으로 건너뛰어져 데이터 없이 로딩에 멈춤.
 * 그래서 화면에 들어올 때마다 새로 읽도록 중복 방지를 끔(이 화면 하나만 씀).
 */
export function useCampaign(campaignIdx: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignIdx === null ? null : campaignKey(campaignIdx),
    () => fetchCampaign(campaignIdx ?? 0),
    { dedupingInterval: 0 },
  );
  return { campaign: data, error, isLoading, mutate };
}

/**
 * 서버 초안. 마법사가 진입할 때 store를 한 번 채우는 데만 쓰므로 포커스·재연결 때 다시 읽지 않음
 * (그 뒤 원본은 store이고, 다시 읽은 값으로 입력 중인 값을 되돌리지 않기 위해서).
 */
export function useCampaignDraft(campaignIdx: number | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    campaignIdx === null ? null : campaignDraftKey(campaignIdx),
    () => fetchCampaignDraft(campaignIdx ?? 0),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );
  return { draft: data, error, isLoading, isValidating, mutate };
}

/**
 * 화면에 들어올 때의 서버 초안. 캐시에 옛 값이 남아 있어도(예: 결제·승인 요청 취소로 상태가 바뀐 뒤) 그것으로 시작하지 않도록
 * 새로 읽은 값이 오면 그때부터 그 값을 돌려주고, 한 번 정해지면 이후 다시 읽어도 바꾸지 않음(입력 중인 값을 되돌리지 않기 위해서).
 * 캠페인이 바뀌면 다시 정함.
 */
export function useInitialCampaignDraft(campaignIdx: number | null) {
  const { draft, error, isValidating } = useCampaignDraft(campaignIdx);
  const [initial, setInitial] = useState<{
    campaignIdx: number;
    draft: CampaignDraft;
  } | null>(null);

  const isLatched = initial !== null && initial.campaignIdx === campaignIdx;
  if (!isLatched && campaignIdx !== null && draft && !isValidating) {
    setInitial({ campaignIdx, draft });
  }
  return {
    draft: isLatched ? initial.draft : undefined,
    error,
  };
}
