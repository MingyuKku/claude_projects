import { fromIsoDate, toIsoDate } from "@/shared/lib";

import type { CampaignProductType } from "./codes";

/** 상품 유형별 캠페인 기간(일). 종료일은 희망 시작일 + 이 일수이고 서버가 같은 규칙으로 저장함(API A-5.1). */
const CAMPAIGN_PERIOD_DAYS: Record<CampaignProductType, number> = {
  BRAND: 30,
  GROUP_BUY: 60,
};

export function getCampaignPeriodDays(productType: CampaignProductType) {
  return CAMPAIGN_PERIOD_DAYS[productType];
}

/** 희망 시작일(`yyyy-MM-dd`)로 예정 종료일을 계산함. 날짜가 없거나 형식이 틀리면 null. */
export function getCampaignEndDate(
  startDate: string | null,
  productType: CampaignProductType,
) {
  const start = fromIsoDate(startDate);
  if (!start) return null;
  start.setDate(start.getDate() + getCampaignPeriodDays(productType));
  return toIsoDate(start);
}
