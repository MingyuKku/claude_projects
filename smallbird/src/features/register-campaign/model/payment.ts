import { calculateCampaignPayment } from "@/entities/campaign";

import type { CampaignDraft, CampaignServiceType } from "@/entities/campaign";

export function calculateDraftPayment(
  serviceType: CampaignServiceType,
  { info, addOns, conditions }: CampaignDraft,
) {
  return calculateCampaignPayment({
    serviceType,
    campaignType: info.campaignType,
    addOns,
    headcount: conditions.headcount,
    rewardPerInfluencer: conditions.rewardPerInfluencer,
  });
}
