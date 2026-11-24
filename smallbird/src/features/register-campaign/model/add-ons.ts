import { CAMPAIGN_ADD_ONS } from "@/entities/campaign";

import type { CampaignAddOn, CampaignProductType } from "@/entities/campaign";

/** 상품 유형별로 고를 수 있는 부가서비스. 공구형은 원고컨펌 절차가 없어 포스팅 가이드뿐. */
export function getAvailableAddOns(
  productType: CampaignProductType,
): readonly CampaignAddOn[] {
  return productType === "GROUP_BUY"
    ? CAMPAIGN_ADD_ONS.filter((addOn) => addOn === "POSTING_GUIDE")
    : CAMPAIGN_ADD_ONS;
}
