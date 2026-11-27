import { useTranslation } from "@/shared/i18n";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

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
import type { ReactNode } from "react";

interface ProposalTableProps extends ProposalRowActions {
  proposals: CampaignProposal[];
  selection: ProposalSelection;
  now: number;
  emptyContent?: ReactNode;
}

const COLUMN_COUNT = 9;

// PC 표. 고정 폭 열 외에는 프로필 열이 남는 폭을 차지함.
export function ProposalTable({
  proposals,
  selection,
  now,
  emptyContent,
  ...actions
}: ProposalTableProps) {
  const { t } = useTranslation("features/campaign-matching");
  const { formatWon, formatDateTime, formatRemaining } = useProposalFormat(now);

  return (
    <Table headerTone="gray" size="xs" aria-label={t("list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              aria-label={t("action.selectAll")}
              checked={selection.allState}
              disabled={actions.isReadOnly || selection.selectableCount === 0}
              onCheckedChange={(state) => selection.toggleAll(state === true)}
            />
          </TableHead>
          <TableHead>{t("column.profile")}</TableHead>
          <TableHead className="w-25 text-center">
            {t("column.platform")}
          </TableHead>
          <TableHead className="w-30">{t("column.amount")}</TableHead>
          <TableHead className="w-24.75">{t("column.status")}</TableHead>
          <TableHead className="w-45">{t("column.respondedAt")}</TableHead>
          <TableHead className="w-35">{t("column.remaining")}</TableHead>
          <TableHead className="w-21 text-center">
            {t("column.detail")}
          </TableHead>
          <TableHead className="w-24">
            <span className="sr-only">{t("column.pay")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {emptyContent ? (
          <TableRow className="[--table-row-hover:transparent]">
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-auto p-0 whitespace-normal"
            >
              {emptyContent}
            </TableCell>
          </TableRow>
        ) : (
          proposals.map((proposal) => {
            const name = getProposalName(proposal);
            const isSelectable = selection.isSelectable(proposal);
            return (
              <TableRow
                key={proposal.proposalIdx}
                data-state={
                  selection.isSelected(proposal) ? "selected" : undefined
                }
              >
                <TableCell>
                  <Checkbox
                    aria-label={t("action.selectRow", { name })}
                    checked={selection.isSelected(proposal)}
                    disabled={actions.isReadOnly || !isSelectable}
                    onCheckedChange={(state) =>
                      selection.toggle(proposal, state === true)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <ProposalAvatar proposal={proposal} size="sm" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="-mb-1 truncate pb-1 ds-text-sm-none-medium text-foreground">
                        {name}
                      </p>
                      <p className="truncate ds-text-xs-4-normal text-muted-foreground">
                        @{proposal.handle}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <ProposalPlatform proposal={proposal} />
                  </div>
                </TableCell>
                <TableCell>{formatWon(proposal.amount)}</TableCell>
                <TableCell>
                  <ProposalStatusBadge proposal={proposal} />
                </TableCell>
                <TableCell>{formatDateTime(proposal.lastMessageAt)}</TableCell>
                <TableCell className="font-semibold">
                  {hasActiveDeadline(proposal)
                    ? formatRemaining(proposal.responseDeadline)
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <ProposalDetailToggle
                      proposal={proposal}
                      onOpenDetail={actions.onOpenDetail}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <ProposalPayButton
                      proposal={proposal}
                      onPay={actions.onPay}
                      isReadOnly={actions.isReadOnly}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
