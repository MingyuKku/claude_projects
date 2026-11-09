import { PlatformIcon } from "@/shared/components/platform-icon";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import { getCampaignPlatformIcon } from "../../../lib/platform-icon";
import { isCampaignPlatform } from "../../../model/codes";
import { useCampaignLabels } from "../../../model/use-campaign-labels";
import {
  SummaryField,
  SummaryFieldGrid,
  SummarySection,
} from "../SummarySection";

import type { CampaignDetail } from "../../../model/schema";

interface SectionProps {
  campaign: CampaignDetail;
  id: string;
}

// 3 인플루언서 조건: 플랫폼(로고)·연령대·성별·포스팅 주제.
export function InfluencerSection({ campaign, id }: SectionProps) {
  const { t } = useTranslation("entities/campaign");
  const labels = useCampaignLabels();
  const { influencer } = campaign;
  const join = (values: string[]) =>
    values.length > 0 ? values.join(", ") : "-";

  return (
    <SummarySection id={id} number={3} title={t("summary.influencer.title")}>
      <SummaryFieldGrid>
        <SummaryField label={t("summary.influencer.platform")}>
          {influencer.platform ? (
            <span className="flex items-center gap-1.5">
              {isCampaignPlatform(influencer.platform) && (
                <PlatformIcon
                  platform={getCampaignPlatformIcon(influencer.platform)}
                  className="size-4"
                />
              )}
              {labels.platform(influencer.platform)}
            </span>
          ) : (
            "-"
          )}
        </SummaryField>
        <SummaryField label={t("summary.influencer.gender")}>
          {influencer.gender ? labels.gender(influencer.gender) : "-"}
        </SummaryField>
        <SummaryField label={t("summary.influencer.ageGroup")}>
          {join(influencer.ageGroups.map(labels.ageGroup))}
        </SummaryField>
        <SummaryField label={t("summary.influencer.topic")}>
          {join(influencer.topics.map(labels.topic))}
        </SummaryField>
      </SummaryFieldGrid>
    </SummarySection>
  );
}

// 4 부가서비스: 신청한 항목마다 초록 배지 "신청함"(인원당은 "(5,000원/인)"). 단가는 서버가 결제 때 정한 값(`addOnPrices`)을 씀.
export function AddOnsSection({ campaign, id }: SectionProps) {
  const { t } = useTranslation("entities/campaign");
  const labels = useCampaignLabels();

  return (
    <SummarySection id={id} number={4} title={t("summary.addOns.title")}>
      {campaign.addOns.length === 0 ? (
        <SummaryField label={t("summary.addOns.none")}>-</SummaryField>
      ) : (
        <SummaryFieldGrid>
          {campaign.addOns.map((code) => {
            const price = campaign.addOnPrices.find((p) => p.code === code);
            return (
              <SummaryField key={code} label={labels.addOn(code)}>
                <Badge variant="green" size="sm">
                  {price?.unit === "PER_INFLUENCER"
                    ? t("summary.addOns.appliedPerInfluencer", {
                        amount: formatNumber(price.unitPrice),
                      })
                    : t("summary.addOns.applied")}
                </Badge>
              </SummaryField>
            );
          })}
        </SummaryFieldGrid>
      )}
    </SummarySection>
  );
}
