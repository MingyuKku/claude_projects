import { toIsoDate } from "@/shared/lib";

import { startOfToday } from "./campaign-period";

import type { CampaignDraft } from "@/entities/campaign";

/**
 * 불러온 캠페인의 희망 시작일이 이미 지난 날짜면 오늘로 맞춘 초안(v2와 같은 동작). 바뀌지 않았으면 같은 객체를 돌려줌.
 * `yyyy-MM-dd`는 문자열 비교가 날짜 순서와 같음.
 */
export function adjustPastStartDate(
  draft: CampaignDraft,
  today = startOfToday(),
): CampaignDraft {
  const { startDate } = draft.campaignInfo;
  const todayIso = toIsoDate(today);
  if (startDate === null || startDate >= todayIso) return draft;
  return {
    ...draft,
    campaignInfo: { ...draft.campaignInfo, startDate: todayIso },
  };
}
