import type { CampaignType } from "@/entities/campaign";

/** 캠페인 유형 이름 번역 키(1단계 토글, 불러오기 목록). */
export const CAMPAIGN_TYPE_LABEL_KEYS = {
  PRODUCT_DELIVERY: "info.type.PRODUCT_DELIVERY",
  PRESS: "info.type.PRESS",
  STORE_VISIT: "info.type.STORE_VISIT",
} as const satisfies Record<CampaignType, string>;
