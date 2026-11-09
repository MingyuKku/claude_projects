import { formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";

import { useCampaignLabels } from "../../../model/use-campaign-labels";
import {
  SummaryField,
  SummaryFieldGrid,
  SummarySection,
} from "../SummarySection";

import type { CampaignDetail } from "../../../model/schema";

function formatDate(value: string | null) {
  const date = fromIsoDate(value);
  return date ? formatNumericDate(date) : null;
}

// 1 캠페인 정보: 캠페인명·코드·유형·브랜드·진행 기간·브랜드 이미지.
export function CampaignInfoSection({
  campaign,
  id,
}: {
  campaign: CampaignDetail;
  id: string;
}) {
  const { t } = useTranslation("entities/campaign");
  const labels = useCampaignLabels();
  const { campaignInfo, brand } = campaign;
  const start = formatDate(campaignInfo.startDate);
  const end = formatDate(campaignInfo.endDate);

  return (
    <SummarySection id={id} number={1} title={t("summary.campaignInfo.title")}>
      <SummaryFieldGrid>
        <SummaryField label={t("summary.campaignInfo.name")}>
          {campaignInfo.name ?? "-"}
        </SummaryField>
        <SummaryField label={t("summary.campaignInfo.type")}>
          {campaignInfo.campaignType
            ? labels.campaignType(campaignInfo.campaignType)
            : "-"}
        </SummaryField>
        <SummaryField label={t("summary.campaignInfo.period")}>
          {start && end ? `${start} - ${end}` : "-"}
        </SummaryField>
        <SummaryField label={t("summary.campaignInfo.code")}>
          {campaign.campaignCode}
        </SummaryField>
        <SummaryField label={t("summary.campaignInfo.brand")}>
          {brand?.nameKo ?? "-"}
        </SummaryField>
        <SummaryField label={t("summary.campaignInfo.brandImage")}>
          {brand?.imageUrl ? (
            <img
              src={brand.imageUrl}
              alt=""
              className="size-20 rounded-md border object-cover"
            />
          ) : (
            "-"
          )}
        </SummaryField>
      </SummaryFieldGrid>
    </SummarySection>
  );
}
