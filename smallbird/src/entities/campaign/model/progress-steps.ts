import { generatePath } from "react-router";

import { ROUTES } from "@/shared/config";

/** 캠페인 진행 단계의 주소 이름. 기본정보는 단계 없이 연다. */
export const CAMPAIGN_PROGRESS_STEPS = [
  "guide",
  "search",
  "matching",
  "delivery",
  "visit",
  "manuscript",
  "posting",
  "result",
] as const;
export type CampaignProgressStep = (typeof CAMPAIGN_PROGRESS_STEPS)[number];

export function toCampaignProgressStep(
  value: string | undefined,
): CampaignProgressStep | null {
  return CAMPAIGN_PROGRESS_STEPS.find((step) => step === value) ?? null;
}

/** 캠페인 진행 경로. 단계를 주지 않으면 기본정보. */
export function getCampaignProgressPath(
  campaignIdx: number,
  step?: CampaignProgressStep,
) {
  return generatePath(ROUTES.campaignProgress, {
    campaignIdx: String(campaignIdx),
    step: step ?? null,
  });
}
