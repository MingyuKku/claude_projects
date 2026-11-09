import { isEqual } from "radash";

import { createEmptyInputs, createEmptyProduct } from "./empty-draft";

import type { CampaignDraft } from "@/entities/campaign";

// 확인 알럿을 띄울지 정하는 "입력한 값이 있는가" 판단.

/** 1~6단계에 입력한 값이 하나라도 있는가. 이전 캠페인 불러오기가 덮어쓰기 확인을 띄울지 정함. 종료일은 서버가 정하는 값이라 보지 않음. */
export function hasAnyInput(draft: CampaignDraft) {
  const empty = createEmptyInputs();
  return (
    !isEqual(
      { ...draft.campaignInfo, endDate: null },
      { ...empty.campaignInfo },
    ) ||
    !isEqual(draft.product, empty.product) ||
    !isEqual(draft.influencer, empty.influencer) ||
    !isEqual(draft.addOns, empty.addOns) ||
    !isEqual(draft.intro, empty.intro) ||
    !isEqual(draft.conditions, empty.conditions)
  );
}

/** 캠페인 유형을 바꾸면 비워지는 값(2단계 입력 전체, 6단계 리워드·구매리뷰형 모집 인원)이 있는가. 유형 변경 확인 알럿이 씀. */
export function hasTypeDependentInput(draft: CampaignDraft) {
  const { conditions } = draft;
  const hasHeadcountOfPurchaseReview =
    draft.campaignInfo.campaignType === "PURCHASE_REVIEW" &&
    conditions.headcount !== null;
  return (
    !isEqual(draft.product, createEmptyProduct()) ||
    conditions.rewardPerInfluencer !== null ||
    hasHeadcountOfPurchaseReview
  );
}
