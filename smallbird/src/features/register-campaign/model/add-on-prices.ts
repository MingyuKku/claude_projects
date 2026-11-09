import type { CampaignAddOn } from "@/entities/campaign";

/** 부가서비스 가격 표시 방식: 캠페인당 한 번(`TOTAL`) 또는 모집 인플루언서 한 명당(`PER_INFLUENCER`). */
export const ADD_ON_PRICES: Record<
  CampaignAddOn,
  { unit: "TOTAL" | "PER_INFLUENCER"; amount: number }
> = {
  AI_POSTING_GUIDE: { unit: "TOTAL", amount: 10000 },
  AI_MANUSCRIPT_CONFIRM: { unit: "PER_INFLUENCER", amount: 5000 },
  AI_RECEIPT_REVIEW: { unit: "PER_INFLUENCER", amount: 5000 },
};
