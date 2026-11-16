import { ChevronRight, FileText } from "lucide-react";

import { DeleteCampaignButton } from "@/features/delete-campaign";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ShortcutKind, IconActionKind } from "../lib/campaign-actions";
import type { CampaignSummary } from "@/entities/campaign";

interface ShortcutButtonProps {
  kind: ShortcutKind;
  onClick: () => void;
  className?: string;
}

// 진행 단계별 바로 가기. 화살표가 붙은 작은 아웃라인 버튼(Figma Button Size=sm).
export function ShortcutButton({
  kind,
  onClick,
  className,
}: ShortcutButtonProps) {
  const { t } = useTranslation("pages/campaign-status");

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-1", className)}
      onClick={onClick}
    >
      {t(`shortcut.${kind}`)}
      <ChevronRight aria-hidden />
    </Button>
  );
}

interface IconActionProps {
  kind: IconActionKind;
  campaign: Pick<CampaignSummary, "campaignIdx">;
  onClickDetail: () => void;
  onDeleted: () => void;
}

// 행 오른쪽 아이콘: 등록 중은 삭제(휴지통), 그 밖은 기본 정보(등록 내역)를 여는 문서 아이콘.
export function IconAction({
  kind,
  campaign,
  onClickDetail,
  onDeleted,
}: IconActionProps) {
  const { t } = useTranslation("pages/campaign-status");

  if (kind === "delete") {
    return (
      <DeleteCampaignButton
        campaignIdx={campaign.campaignIdx}
        onDeleted={onDeleted}
      />
    );
  }
  return (
    <Button
      variant="outline-foreground"
      size="icon-sm"
      aria-label={t("action.detail")}
      className="rounded-md"
      onClick={onClickDetail}
    >
      <FileText />
    </Button>
  );
}
