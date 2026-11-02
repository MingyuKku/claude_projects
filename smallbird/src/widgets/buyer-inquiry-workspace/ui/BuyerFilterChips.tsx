import { X } from "lucide-react";

import {
  useBuyerInfluencerOptions,
  useInquiryCampaigns,
} from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { BuyerInquiryFilters } from "@/entities/inquiry";

interface BuyerFilterChipsProps {
  filters: BuyerInquiryFilters;
  threadUserIdx?: number;
  /** 캠페인 조건을 풀면 그 캠페인의 인플루언서 조건도 함께 풀려야 함. */
  onRemoveCampaign: () => void;
  onRemoveInfluencer: () => void;
}

// Figma 적용된 필터 칩(PC 6782:66862, MO 6790:127367): 캠페인명·인플루언서명 칩, ×로 하나씩 풂.
// 문의 유형은 칩이 아니라 필터 버튼의 활성 표시로 보여 줌. 이름은 필터 대화상자와 같은 목록에서 찾고,
// 아직 받지 못했거나 목록에 없으면 번호로 대신함.
export function BuyerFilterChips({
  filters,
  threadUserIdx,
  onRemoveCampaign,
  onRemoveInfluencer,
}: BuyerFilterChipsProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const { options } = useBuyerInfluencerOptions(filters.campaignIdx);
  const { campaignIdx, influencerThreadUserIdx } = filters;

  const chips = [
    campaignIdx === undefined
      ? null
      : {
          key: "campaign",
          label:
            campaigns?.find((campaign) => campaign.campaignIdx === campaignIdx)
              ?.name ?? t("filter.campaignFallback", { idx: campaignIdx }),
          onRemove: onRemoveCampaign,
        },
    influencerThreadUserIdx === undefined
      ? null
      : {
          key: "influencer",
          label:
            options?.find(
              (option) => option.threadUserIdx === influencerThreadUserIdx,
            )?.displayName ??
            t("filter.influencerFallback", { idx: influencerThreadUserIdx }),
          onRemove: onRemoveInfluencer,
        },
  ].filter((chip) => chip !== null);

  return chips.map((chip) => (
    <Button
      key={chip.key}
      type="button"
      variant="secondary"
      size="xs"
      aria-label={t("filter.removeChip", { name: chip.label })}
      onClick={chip.onRemove}
    >
      {chip.label}
      <X aria-hidden />
    </Button>
  ));
}
