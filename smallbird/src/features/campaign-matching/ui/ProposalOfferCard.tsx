import { ChatSuggestionCard } from "@/shared/components/chat-message";
import { formatNumber, useTranslation } from "@/shared/i18n";

import { useProposalFormat } from "../lib/use-proposal-format";

import type {
  ProposalOffer,
  ProposalStatus,
} from "@/entities/campaign-progress";
import type { Badge } from "@/shared/ui/badge";
import type { ComponentProps, ReactNode } from "react";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

// 카드 배지: 크리에이터가 재협상을 요청한 카드는 노랑, 거절은 빨강(시안 Chat Base / Card).
const BADGE_VARIANT: Record<ProposalStatus, BadgeVariant> = {
  PROPOSED: "blue",
  NEGOTIATING: "yellow",
  ACCEPTED: "yellow",
  PAID: "green",
  REJECTED: "red",
  EXPIRED: "gray",
};

interface ProposalOfferCardProps {
  offer: ProposalOffer;
  /** 목록 줄의 화면 상태(재협상 중 누구 차례인지는 목록에만 있음). */
  displayStatus: ProposalStatus | null;
  size: "md" | "sm";
  actions?: ReactNode;
}

export function ProposalOfferCard({
  offer,
  displayStatus,
  size,
  actions,
}: ProposalOfferCardProps) {
  const { t } = useTranslation("features/campaign-matching");
  const format = useProposalFormat();
  const { status } = offer;
  const badgeKey =
    status === "NEGOTIATING" && displayStatus === "PROPOSED"
      ? "PROPOSED"
      : status;

  return (
    <ChatSuggestionCard
      size={size}
      badge={{
        label: badgeKey ? t(`offer.badge.${badgeKey}`) : "-",
        variant: badgeKey ? BADGE_VARIANT[badgeKey] : "gray",
      }}
      title={offer.campaignName}
      notice={
        status === "REJECTED"
          ? { status: "destructive", text: t("offer.rejected") }
          : undefined
      }
      amountLabel={t("offer.amount")}
      amount={format.formatWon(offer.amount)}
      amountCaption={
        offer.groupBuyFeeRate !== null && (
          <>
            {t("offer.fee")}
            <span className="font-semibold text-foreground">
              {formatNumber(offer.groupBuyFeeRate)}
            </span>
            %
          </>
        )
      }
      details={[
        { label: t("offer.content"), value: offer.campaignType ?? "-" },
        {
          label: t("offer.schedule"),
          value: format.formatDateRange(
            offer.uploadScheduleStart,
            offer.uploadScheduleEnd,
          ),
        },
      ]}
      actions={actions}
    />
  );
}
