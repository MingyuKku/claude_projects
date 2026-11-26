import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import type { CampaignStage } from "../model/codes";

const STAGE_VARIANTS = {
  DRAFT: "blue",
  REVIEWING: "blue",
  REJECTED: "red",
  IN_PROGRESS: "green",
  ENDED: "gray",
} as const satisfies Record<CampaignStage, "green" | "blue" | "red" | "gray">;

interface CampaignStageBadgeProps {
  stage: CampaignStage | null;
  /** 모르는 코드가 오면 이 서버 값을 그대로 보임. */
  rawStatus: string;
}

// 진행 단계 배지(Figma Badge Size=sm). 진행 중은 초록, 등록 중·승인 대기는 파랑, 승인 반려는 빨강, 종료는 회색.
export function CampaignStageBadge({
  stage,
  rawStatus,
}: CampaignStageBadgeProps) {
  const { t } = useTranslation("entities/campaign");

  return (
    <Badge
      size="sm"
      variant={stage ? STAGE_VARIANTS[stage] : "gray"}
      className="ds-text-xs-5-medium"
    >
      {stage ? t(`stage.${stage}`) : rawStatus}
    </Badge>
  );
}
