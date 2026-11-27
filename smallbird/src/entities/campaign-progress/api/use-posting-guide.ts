import useSWR from "swr";

import {
  fetchPostingGuide,
  fetchPostingGuidePayment,
  fetchPostingGuidePreview,
} from "./posting-guide-api";

export function postingGuideKey(campaignIdx: number) {
  return ["campaign-progress", "posting-guide", campaignIdx] as const;
}

/** 포스팅 가이드. `guide`가 null이면 아직 만든 적 없음, undefined면 읽는 중. */
export function usePostingGuide(campaignIdx: number) {
  const { data, error, isLoading, mutate } = useSWR(
    postingGuideKey(campaignIdx),
    ([, , idx]) => fetchPostingGuide(idx),
  );
  return { guide: data, error, isLoading, mutate };
}

/** AI 가이드 결제 상태(이용 중 뱃지·기본 방식). */
export function usePostingGuidePayment(campaignIdx: number) {
  const { data, error } = useSWR(
    ["campaign-progress", "posting-guide-payment", campaignIdx] as const,
    ([, , idx]) => fetchPostingGuidePayment(idx),
  );
  return { payment: data, error };
}

/** 미리보기 화면(새 탭). 저장된 값만 보여 줌. */
export function usePostingGuidePreview(campaignIdx: number) {
  const { data, error } = useSWR(
    ["campaign-progress", "posting-guide-preview", campaignIdx] as const,
    ([, , idx]) => fetchPostingGuidePreview(idx),
  );
  return { preview: data, error };
}
