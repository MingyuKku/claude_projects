import { formatListDate } from "@/shared/i18n";
import { EMPTY_VALUE, fromIsoDate } from "@/shared/lib";

import type { CampaignSummary } from "@/entities/campaign";

function formatDay(value: string | null) {
  const date = fromIsoDate(value);
  return date ? formatListDate(date) : EMPTY_VALUE;
}

/**
 * "YYYY-MM-DD ~ YYYY-MM-DD". 승인 전에는 서버가 주는 희망 일정을 그대로 보이고(스펙 P-6, 답 전 처리), 희망 시작일도 없으면 "-"임.
 */
export function formatCampaignPeriod(
  campaign: Pick<CampaignSummary, "startDate" | "endDate">,
) {
  if (!campaign.startDate) return EMPTY_VALUE;
  return `${formatDay(campaign.startDate)} ~ ${formatDay(campaign.endDate)}`;
}
