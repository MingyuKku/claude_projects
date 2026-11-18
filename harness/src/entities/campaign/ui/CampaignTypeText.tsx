import { useTranslation } from "@/shared/i18n";

import type { CampaignSummary } from "../model/types";

interface CampaignTypeTextProps {
  campaign: Pick<CampaignSummary, "type" | "rawTypeText">;
}

// 서비스+상품 유형("모집형 브랜드형"). 두 코드의 번역을 이어 붙이지 않고 조합마다 키를 둠(어순이 언어마다 다름).
export function CampaignTypeText({ campaign }: CampaignTypeTextProps) {
  const { t } = useTranslation("entities/campaign");

  return (
    <>{campaign.type ? t(`type.${campaign.type}`) : campaign.rawTypeText}</>
  );
}
