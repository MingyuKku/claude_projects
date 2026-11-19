import { calculateCampaignPayment } from "@/entities/campaign";

import type { CampaignDraft, CampaignServiceType } from "@/entities/campaign";

export function calculateDraftPayment(
  serviceType: CampaignServiceType,
  { addOns, conditions }: CampaignDraft,
) {
  return calculateCampaignPayment({
    serviceType,
    addOns,
    headcount: conditions.headcount,
    rewardPerCreator: conditions.rewardPerCreator,
  });
}
