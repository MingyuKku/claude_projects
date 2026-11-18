/** 진행 단계 `status`(캠페인 등록 API 코드 표). 화면 배지는 등록 중·승인 대기·승인 반려·진행 중·종료. */
export const CAMPAIGN_STAGES = [
  "DRAFT",
  "REVIEWING",
  "REJECTED",
  "IN_PROGRESS",
  "ENDED",
] as const;
export type CampaignStage = (typeof CAMPAIGN_STAGES)[number];

export function toCampaignStage(
  serverValue: string | null | undefined,
): CampaignStage | null {
  return CAMPAIGN_STAGES.find((stage) => stage === serverValue) ?? null;
}

export const CAMPAIGN_SERVICE_TYPES = ["RECRUIT", "PICK"] as const;
export type CampaignServiceType = (typeof CAMPAIGN_SERVICE_TYPES)[number];

export const CAMPAIGN_PRODUCT_TYPES = ["BRAND", "GROUP_BUY"] as const;
export type CampaignProductType = (typeof CAMPAIGN_PRODUCT_TYPES)[number];

/** 서비스 × 상품 조합. 목록 필터의 값이자 표시 문구의 키(어순이 언어마다 달라 조합마다 번역을 둠). */
export const CAMPAIGN_TYPE_FILTERS = [
  "recruitBrand",
  "recruitGroupBuy",
  "pickBrand",
  "pickGroupBuy",
] as const;
export type CampaignTypeFilter = (typeof CAMPAIGN_TYPE_FILTERS)[number];

const TYPE_FILTER_CODES: Record<
  CampaignTypeFilter,
  { serviceType: CampaignServiceType; productType: CampaignProductType }
> = {
  recruitBrand: { serviceType: "RECRUIT", productType: "BRAND" },
  recruitGroupBuy: { serviceType: "RECRUIT", productType: "GROUP_BUY" },
  pickBrand: { serviceType: "PICK", productType: "BRAND" },
  pickGroupBuy: { serviceType: "PICK", productType: "GROUP_BUY" },
};

export function getTypeFilterCodes(filter: CampaignTypeFilter) {
  return TYPE_FILTER_CODES[filter];
}

/** 서버 서비스·상품 코드를 조합 키로 바꿈. 모르는 코드면 null(화면이 서버 값을 그대로 보임). */
export function toCampaignTypeFilter(
  serviceType: string | null,
  productType: string | null,
): CampaignTypeFilter | null {
  return (
    CAMPAIGN_TYPE_FILTERS.find((filter) => {
      const codes = TYPE_FILTER_CODES[filter];
      return (
        codes.serviceType === serviceType && codes.productType === productType
      );
    }) ?? null
  );
}

export function isCampaignTypeFilter(
  value: string | null,
): value is CampaignTypeFilter {
  return CAMPAIGN_TYPE_FILTERS.some((filter) => filter === value);
}

/** 현황 목록 한 쪽의 개수(REQ-5-0014). */
export const CAMPAIGN_PAGE_SIZE = 6;

/** 이전 캠페인 불러오기 목록 한 번에 읽는 개수(A-2 기본값). 끝에 닿으면 이어 읽음. */
export const COPY_SOURCE_PAGE_SIZE = 20;
