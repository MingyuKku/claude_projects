import { getDisplayStatus } from "@/entities/campaign-progress";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import type {
  CampaignProposal,
  ProposalStatus,
} from "@/entities/campaign-progress";
import type { ComponentProps } from "react";

// 상태별 배지 색. 만료는 거절과 같은 회색.
const STATUS_VARIANT: Record<
  ProposalStatus,
  ComponentProps<typeof Badge>["variant"]
> = {
  PROPOSED: "blue",
  NEGOTIATING: "red",
  ACCEPTED: "yellow",
  PAID: "green",
  REJECTED: "gray",
  EXPIRED: "gray",
};

/** 모르는 상태 코드는 서버 값을 회색 배지로 그대로 보임. */
export function ProposalStatusBadge({
  proposal,
}: {
  proposal: CampaignProposal;
}) {
  const { t } = useTranslation("features/campaign-matching");
  const status = getDisplayStatus(proposal);
  return (
    <Badge size="sm" variant={status ? STATUS_VARIANT[status] : "gray"}>
      {status ? t(`status.${status}`) : proposal.rawStatus}
    </Badge>
  );
}
