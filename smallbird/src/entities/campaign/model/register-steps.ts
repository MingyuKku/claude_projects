import { generatePath } from "react-router";

import { ROUTES } from "@/shared/config";

import type { CampaignDraftStep } from "./draft";

// 등록 마법사의 단계 주소(`?step=`). 공구형처럼 단계가 늘어도 주소가 바뀌지 않게 번호 대신 이름을 씀(스펙 §3 경로).
// 등록 마법사·등록 내역(수정·승인 요청 취소 뒤 이동)이 함께 써서 엔티티에 둠.

export const CAMPAIGN_STEP_PARAM = "step";

export const CAMPAIGN_REGISTER_STEPS = [
  "campaign-info",
  "product",
  "creator",
  "add-ons",
  "intro",
  "conditions",
  "policy",
  "payment",
] as const;
export type CampaignRegisterStep = (typeof CAMPAIGN_REGISTER_STEPS)[number];

/** 단계마다 저장하는 초안 묶음. 결제 단계는 저장할 입력이 없음. */
export const DRAFT_STEP_BY_REGISTER_STEP: Record<
  CampaignRegisterStep,
  CampaignDraftStep | null
> = {
  "campaign-info": "info",
  product: "product",
  creator: "creator",
  "add-ons": "addOns",
  intro: "intro",
  conditions: "conditions",
  policy: "policy",
  payment: null,
};

export function toCampaignRegisterStep(
  value: string | null,
): CampaignRegisterStep | null {
  return CAMPAIGN_REGISTER_STEPS.find((step) => step === value) ?? null;
}

export const CAMPAIGN_REGISTER_TYPE_PARAM = "type";
export const CAMPAIGN_REGISTER_DEMO_PARAM = "demo";

/** 새 캠페인 등록 진입 경로. 들어오면 캠페인을 만들고 작성 경로로 바꿈. 서비스 값은 개설 화면의 `service`와 같음. */
export function getNewCampaignRegisterPath(
  service: "pick" | "recruit",
  { isDemo = false }: { isDemo?: boolean } = {},
) {
  const params = new URLSearchParams({
    [CAMPAIGN_REGISTER_TYPE_PARAM]: service,
  });
  if (isDemo) params.set(CAMPAIGN_REGISTER_DEMO_PARAM, "true");
  return `${ROUTES.campaignRegister}?${params.toString()}`;
}

/** 작성 경로. 단계를 주지 않으면 마법사가 아직 끝내지 않은 첫 단계로 엶. */
export function getCampaignRegisterPath(
  campaignIdx: number,
  step?: CampaignRegisterStep,
) {
  const path = generatePath(ROUTES.campaignRegisterEdit, {
    campaignIdx: String(campaignIdx),
  });
  return step ? `${path}?${CAMPAIGN_STEP_PARAM}=${step}` : path;
}

/** 등록 내역(기본 정보) 경로. */
export function getCampaignDetailPath(campaignIdx: number) {
  return generatePath(ROUTES.campaignDetail, {
    campaignIdx: String(campaignIdx),
  });
}

/** 주소의 캠페인 번호. 양의 정수가 아니면 null. */
export function parseCampaignIdx(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
