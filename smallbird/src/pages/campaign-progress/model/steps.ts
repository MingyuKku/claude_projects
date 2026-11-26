import {
  getCampaignDetailPath,
  getCampaignProgressPath,
} from "@/entities/campaign";

import type {
  CampaignDetail,
  CampaignProgressStep,
  CampaignType,
} from "@/entities/campaign";

// 캠페인 진행 단계 구성(스펙 campaign/progress §3). 유형·부가서비스·종료 여부가 바뀌어도 이 파일만 고친다.

/** 메뉴 번호가 붙는 단계(결과 제외). 유형에 없는 단계는 빠지고 번호는 보이는 순서대로 매긴다. */
export type ProgressMenuStep = Exclude<CampaignProgressStep, "result">;

/** 유형별 배송·방문 단계. 기자단형은 없음(REQ-14-0005). */
const FULFILLMENT_STEP: Record<CampaignType, ProgressMenuStep | null> = {
  PRODUCT_DELIVERY: "delivery",
  STORE_VISIT: "visit",
  PRESS: null,
};

export function getProgressMenuSteps(
  detail: CampaignDetail,
): ProgressMenuStep[] {
  const fulfillment = detail.draft.info.campaignType
    ? FULFILLMENT_STEP[detail.draft.info.campaignType]
    : null;
  return [
    "guide",
    "search",
    "matching",
    ...(fulfillment ? [fulfillment] : []),
    // 원고 컨펌은 신청 여부와 상관없이 항상 있음(미신청이면 안내 화면, 기획 2026-11-26).
    "manuscript",
    "posting",
  ];
}

/** 진행 화면에서 볼 수 있는 캠페인. 이번 범위는 승인된 PICK형 브랜드형(데모 제외). */
export function isProgressAvailable(detail: CampaignDetail) {
  return (
    detail.serviceType === "PICK" &&
    detail.productType === "BRAND" &&
    !detail.isDemo &&
    (detail.stage === "IN_PROGRESS" || detail.stage === "ENDED")
  );
}

/**
 * 주소의 단계로 열 수 없으면 보낼 곳. 진행 화면 대상이 아니면 등록 내역,
 * 모르는 단계·유형에 없는 단계는 기본정보. 종료된 캠페인도 모든 단계를 조회함(REQ-14-0010).
 */
export function getProgressRedirectPath(
  detail: CampaignDetail,
  rawStep: string | undefined,
  step: CampaignProgressStep | null,
) {
  if (!isProgressAvailable(detail))
    return getCampaignDetailPath(detail.campaignIdx);
  if (rawStep === undefined || step === "result") return null;
  const isInMenu = getProgressMenuSteps(detail).some((item) => item === step);
  return isInMenu ? null : getCampaignProgressPath(detail.campaignIdx);
}
