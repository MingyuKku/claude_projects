import { useCampaignLabels } from "@/entities/campaign";
import { ProfileTableCard } from "@/shared/components/cards";
import { useTranslation } from "@/shared/i18n";

import { formatCreatedDate, PlatformCell } from "./PreviousCampaignCells";

import type { PreviousCampaign } from "@/entities/campaign";

interface PreviousCampaignCardsProps {
  campaigns: PreviousCampaign[];
  selectedCampaignIdx: number | null;
  onSelect: (campaignIdx: number | null) => void;
}

// TAB·MO 목록(Figma 7555:355174·7555:420882): 캠페인 한 건이 카드이고 체크박스 + 캠페인명 아래에 브랜드·유형·플랫폼(로고만)·등록일 행.
export function PreviousCampaignCards({
  campaigns,
  selectedCampaignIdx,
  onSelect,
}: PreviousCampaignCardsProps) {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();

  return (
    <ul className="flex flex-col gap-4">
      {campaigns.map((campaign) => {
        const isSelected = campaign.campaignIdx === selectedCampaignIdx;
        return (
          <li key={campaign.campaignIdx}>
            <ProfileTableCard
              name={campaign.name}
              checkboxLabel={t("loadPrevious.select", { name: campaign.name })}
              isChecked={isSelected}
              onCheckedChange={(checked) =>
                onSelect(checked ? campaign.campaignIdx : null)
              }
              rows={[
                {
                  id: "brand",
                  label: t("loadPrevious.column.brand"),
                  value: campaign.brandName,
                },
                {
                  id: "type",
                  label: t("loadPrevious.column.type"),
                  value:
                    campaign.campaignType === null
                      ? null
                      : labels.campaignType(campaign.campaignType),
                },
                {
                  id: "platform",
                  label: t("loadPrevious.column.platform"),
                  value: (
                    <PlatformCell
                      platform={campaign.platform}
                      hasName={false}
                    />
                  ),
                },
                {
                  id: "createdDate",
                  label: t("loadPrevious.column.createdDate"),
                  value: formatCreatedDate(campaign.createdDate),
                },
              ]}
            />
          </li>
        );
      })}
    </ul>
  );
}
