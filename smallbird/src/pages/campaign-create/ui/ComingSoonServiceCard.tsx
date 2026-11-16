import { TriangleAlert } from "lucide-react";

import { EmptyIllustration } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { CardTitleBlock } from "./CardTitleBlock";

import type { ServiceBadgeId } from "../model/services";

interface ComingSoonServiceCardProps {
  type: "live" | "applicator";
  badges: readonly ServiceBadgeId[];
}

// 라이브형·어플리에이터형. 누르거나 구독·데모로 갈 수 없는 "준비중" 카드(REQ-4-0008·0009).
export function ComingSoonServiceCard({
  type,
  badges,
}: ComingSoonServiceCardProps) {
  const { t } = useTranslation("pages/campaign-create");

  return (
    <Card className="tablet:min-h-96">
      <CardTitleBlock
        eyebrow={t(`service.${type}.name`)}
        isEyebrowMuted
        title={t(`service.${type}.name`)}
        badges={badges.map((badge) => (
          <Badge key={badge} variant="gray">
            {t(`badge.${badge}`)}
          </Badge>
        ))}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 ds-p-5 text-center ds-text-sm-5-normal whitespace-pre-line text-muted-foreground">
        <EmptyIllustration type="construction" className="size-5" />
        {t("comingSoon")}
      </div>
      <div className="flex flex-col gap-1 ds-p-5">
        <Button className="w-full" disabled>
          <TriangleAlert aria-hidden />
          {t("action.comingSoonButton")}
        </Button>
      </div>
    </Card>
  );
}
