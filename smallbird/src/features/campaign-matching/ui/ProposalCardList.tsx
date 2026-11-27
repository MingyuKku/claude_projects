import { ProfileTableCard } from "@/shared/components/cards";
import { useTranslation } from "@/shared/i18n";

import { getProposalName, hasActiveDeadline } from "../lib/selection";
import { useProposalFormat } from "../lib/use-proposal-format";
import {
  ProposalAvatar,
  ProposalDetailToggle,
  ProposalPayButton,
  ProposalPlatform,
} from "./ProposalRowParts";
import { ProposalStatusBadge } from "./ProposalStatusBadge";

import type { ProposalSelection } from "../lib/use-proposal-selection";
import type { ProposalRowActions } from "./ProposalRowParts";
import type { CampaignProposal } from "@/entities/campaign-progress";

interface ProposalCardListProps extends ProposalRowActions {
  proposals: CampaignProposal[];
  selection: ProposalSelection;
  now: number;
}

// TAB·MO 카드 목록. TAB은 두 열.
export function ProposalCardList({
  proposals,
  selection,
  now,
  ...actions
}: ProposalCardListProps) {
  const { t } = useTranslation("features/campaign-matching");
  const { formatWon, formatDateTime, formatRemaining } = useProposalFormat(now);

  return (
    <ul
      aria-label={t("list.label")}
      className="grid grid-cols-1 gap-4 tablet:grid-cols-2"
    >
      {proposals.map((proposal) => {
        const name = getProposalName(proposal);
        return (
          <li key={proposal.proposalIdx}>
            <ProfileTableCard
              avatar={<ProposalAvatar proposal={proposal} size="md" />}
              name={name}
              description={`@${proposal.handle}`}
              checkboxLabel={t("action.selectRow", { name })}
              isChecked={selection.isSelected(proposal)}
              isCheckDisabled={
                actions.isReadOnly || !selection.isSelectable(proposal)
              }
              onCheckedChange={(checked) => selection.toggle(proposal, checked)}
              actions={
                <>
                  <ProposalDetailToggle
                    proposal={proposal}
                    onOpenDetail={actions.onOpenDetail}
                  />
                  <ProposalPayButton
                    proposal={proposal}
                    onPay={actions.onPay}
                    isReadOnly={actions.isReadOnly}
                  />
                </>
              }
              rows={[
                {
                  id: "platform",
                  label: t("column.platform"),
                  value: <ProposalPlatform proposal={proposal} />,
                },
                {
                  id: "amount",
                  label: t("column.amount"),
                  value: formatWon(proposal.amount),
                },
                {
                  id: "status",
                  label: t("column.status"),
                  value: <ProposalStatusBadge proposal={proposal} />,
                },
                {
                  id: "respondedAt",
                  label: t("column.respondedAt"),
                  value: formatDateTime(proposal.lastMessageAt),
                },
                {
                  id: "remaining",
                  label: t("column.remaining"),
                  value: (
                    <span className="font-semibold">
                      {hasActiveDeadline(proposal)
                        ? formatRemaining(proposal.responseDeadline)
                        : "-"}
                    </span>
                  ),
                },
              ]}
            />
          </li>
        );
      })}
    </ul>
  );
}
