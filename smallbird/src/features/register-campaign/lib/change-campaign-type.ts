import { createEmptyProduct } from "./empty-draft";

import type { CampaignDraft, CampaignType } from "@/entities/campaign";

/**
 * 캠페인 유형을 바꾼 초안. 2단계 입력 전체와 6단계의 유형 전용 값(리워드, 구매리뷰형 모집 인원)을 비움(REQ-10-0010).
 * 진행 인원은 구매리뷰형을 오가지 않으면 유형과 관계없는 값이라 유지함. 다른 단계는 그대로 둠.
 */
export function changeCampaignType(
  draft: CampaignDraft,
  campaignType: CampaignType,
): CampaignDraft {
  const previousType = draft.campaignInfo.campaignType;
  if (previousType === campaignType) return draft;
  const crossesPurchaseReview =
    previousType === "PURCHASE_REVIEW" || campaignType === "PURCHASE_REVIEW";
  return {
    ...draft,
    campaignInfo: { ...draft.campaignInfo, campaignType },
    product: createEmptyProduct(),
    conditions: {
      ...draft.conditions,
      rewardPerInfluencer: null,
      headcount: crossesPurchaseReview ? null : draft.conditions.headcount,
    },
  };
}
