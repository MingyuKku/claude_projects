import {
  CAMPAIGN_REGISTER_DEMO_PARAM,
  CAMPAIGN_REGISTER_GROUP_BUY_PRODUCT,
  CAMPAIGN_REGISTER_PRODUCT_PARAM,
  CAMPAIGN_REGISTER_TYPE_PARAM,
  getCampaignDetailPath,
} from "@/entities/campaign";

import type { CampaignDetail, CampaignProductType } from "@/entities/campaign";

// 등록 진입(`/campaign/register?type=`)과 작성 경로에 온 캠페인을 어디서 보여 줄지 정함(스펙 register §3 경로·상태별 진입).

export type RegisterEntry =
  | { kind: "create"; isDemo: boolean; productType: CampaignProductType }
  /** 모집형은 갱신 작업 전이라 준비 중 화면(사용자 결정 2026-11-16). */
  | { kind: "comingSoon" }
  | { kind: "invalid" };

export function parseRegisterEntry(
  searchParams: URLSearchParams,
): RegisterEntry {
  const type = searchParams.get(CAMPAIGN_REGISTER_TYPE_PARAM);
  const product = searchParams.get(CAMPAIGN_REGISTER_PRODUCT_PARAM);
  // 파라미터가 없으면 브랜드형이고, 알 수 없는 값은 잘못된 주소.
  const isGroupBuy = product === CAMPAIGN_REGISTER_GROUP_BUY_PRODUCT;
  if (product !== null && !isGroupBuy) return { kind: "invalid" };
  if (type === "pick") {
    return {
      kind: "create",
      isDemo: searchParams.get(CAMPAIGN_REGISTER_DEMO_PARAM) === "true",
      productType: isGroupBuy ? "GROUP_BUY" : "BRAND",
    };
  }
  if (type === "recruit") return { kind: "comingSoon" };
  return { kind: "invalid" };
}

/**
 * 작성 경로에서 열 수 없는 캠페인이면 보낼 곳. 승인 요청 이후 상태와 작성을 마친 데모는 등록 내역(기본 정보)에서 봄.
 * 반려 캠페인은 등록 내역의 "수정"으로 들어와 수정 모드로 엶.
 */
export function getRegisterRedirectPath(detail: CampaignDetail) {
  const isDraft = detail.stage === "DRAFT" && !detail.isDemoCompleted;
  const isWritable = isDraft || detail.stage === "REJECTED";
  return isWritable ? null : getCampaignDetailPath(detail.campaignIdx);
}
