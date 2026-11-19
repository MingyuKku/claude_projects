import { X } from "lucide-react";

import {
  useBuyerCreatorOptions,
  useInquiryCampaigns,
} from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { toSourceParam } from "../lib/filters";

import type { BuyerInquiryFilters } from "@/entities/inquiry";

interface BuyerFilterChipsProps {
  filters: BuyerInquiryFilters;
  threadUserIdx?: number;
  onRemoveSource: () => void;
  /** 캠페인 조건을 풀면 그 캠페인의 크리에이터 조건도 함께 풀려야 함. */
  onRemoveCampaign: () => void;
  onRemoveCreator: () => void;
}

// Figma 적용된 필터 칩(PC 6782:66862, MO 6790:127367): 캠페인명·크리에이터명 칩, ×로 하나씩 풂.
// 문의 유형도 칩으로 보임(사용자 결정 2026-11-09, 시안은 필터 버튼 활성 표시만). 이름은 필터 대화상자와 같은 목록에서
// 찾고, 아직 받지 못했거나 목록에 없으면 번호로 대신함.
export function BuyerFilterChips({
  filters,
  threadUserIdx,
  onRemoveSource,
  onRemoveCampaign,
  onRemoveCreator,
}: BuyerFilterChipsProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const { options } = useBuyerCreatorOptions(filters.campaignIdx);
  const { campaignIdx, creatorThreadUserIdx } = filters;
  const source = toSourceParam(filters.sourceType);

  const chips = [
    source === undefined
      ? null
      : {
          key: "source",
          label: t(`source.${source}`),
          onRemove: onRemoveSource,
        },
    campaignIdx === undefined
      ? null
      : {
          key: "campaign",
          label:
            campaigns?.find((campaign) => campaign.campaignIdx === campaignIdx)
              ?.name || t("filter.campaignFallback", { idx: campaignIdx }),
          onRemove: onRemoveCampaign,
        },
    creatorThreadUserIdx === undefined
      ? null
      : {
          key: "creator",
          label:
            options?.find(
              (option) => option.threadUserIdx === creatorThreadUserIdx,
            )?.displayName ??
            t("filter.creatorFallback", { idx: creatorThreadUserIdx }),
          onRemove: onRemoveCreator,
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
