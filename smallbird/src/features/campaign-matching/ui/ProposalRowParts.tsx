import { SquareMenu } from "lucide-react";

import { isPayableProposal } from "@/entities/campaign-progress";
import { toMatchingPlatform } from "@/entities/platform";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Toggle } from "@/shared/ui/toggle";

import { getProposalName } from "../lib/selection";

import type { CampaignProposal } from "@/entities/campaign-progress";

export interface ProposalRowActions {
  onOpenDetail: (proposal: CampaignProposal) => void;
  onPay: (proposal: CampaignProposal) => void;
  /** 종료된 캠페인: 결제 등 동작을 막음(조회만). */
  isReadOnly: boolean;
}

export function ProposalAvatar({
  proposal,
  size,
}: {
  proposal: CampaignProposal;
  size: "sm" | "md";
}) {
  return (
    <Avatar size={size}>
      <AvatarImage src={proposal.profileImageUrl ?? undefined} alt="" />
      <AvatarPlaceholder />
    </Avatar>
  );
}

export function ProposalPlatform({ proposal }: { proposal: CampaignProposal }) {
  const platform = toMatchingPlatform(proposal.platformIdx);
  return platform ? (
    <PlatformIcon platform={platform} className="size-6" />
  ) : (
    "-"
  );
}

/** 매칭 내역(아이콘 토글, 시안 Toggle outline sm). */
export function ProposalDetailToggle({
  proposal,
  onOpenDetail,
}: Pick<ProposalRowActions, "onOpenDetail"> & { proposal: CampaignProposal }) {
  const { t } = useTranslation("features/campaign-matching");
  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={false}
      aria-label={t("action.detail", { name: getProposalName(proposal) })}
      onPressedChange={() => onOpenDetail(proposal)}
    >
      <SquareMenu aria-hidden />
    </Toggle>
  );
}

/** 결제하기. 결제 대기 행에서만 켜짐(시안: 나머지는 흐린 버튼). */
export function ProposalPayButton({
  proposal,
  onPay,
  isReadOnly,
}: Pick<ProposalRowActions, "onPay" | "isReadOnly"> & {
  proposal: CampaignProposal;
}) {
  const { t } = useTranslation("features/campaign-matching");
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isReadOnly || !isPayableProposal(proposal)}
      onClick={() => onPay(proposal)}
    >
      {t("action.pay")}
    </Button>
  );
}
