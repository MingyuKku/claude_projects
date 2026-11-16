import { ChevronRight } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { SERVICE_FEATURE_LINES } from "../model/services";
import { CardTitleBlock } from "./CardTitleBlock";
import { FeatureList } from "./FeatureList";

import type { ServiceBadgeId } from "../model/services";
import type { ActiveProductType } from "@/entities/subscription";

interface ServiceCardProps {
  type: ActiveProductType;
  badges: readonly ServiceBadgeId[];
  isSubscribed: boolean;
  isSelected: boolean;
  onSelect: (type: ActiveProductType) => void;
  onClickSubscribe: () => void;
}

// 모집형·PICK형 서비스 카드. 카드(머리글·설명)를 누르면 선택되고, 아래 버튼은 각자 동작함.
// 구독 중이면 "서비스 이용 중" 비활성 버튼과 "이용 중" 뱃지, 아니면 데모 체험하기·구독하기.
export function ServiceCard({
  type,
  badges,
  isSubscribed,
  isSelected,
  onSelect,
  onClickSubscribe,
}: ServiceCardProps) {
  const { t } = useTranslation("pages/campaign-create");

  return (
    <Card
      interactive
      className={cn(
        "relative focus-visible:ring-0 focus-visible:ring-offset-0 tablet:min-h-96",
        "has-[[data-slot=card-select]:focus-visible]:ring-2 has-[[data-slot=card-select]:focus-visible]:ring-primary has-[[data-slot=card-select]:focus-visible]:ring-offset-2",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <button
        type="button"
        data-slot="card-select"
        aria-pressed={isSelected}
        className="flex flex-1 cursor-pointer flex-col items-stretch text-left outline-none"
        onClick={() => onSelect(type)}
      >
        <CardTitleBlock
          eyebrow={isSelected ? t(`service.${type}.name`) : undefined}
          title={t(`service.${type}.name`)}
          badges={badges.map((badge) => (
            <Badge
              key={badge}
              variant={badge === "groupBuy" ? "green" : "blue"}
            >
              {t(`badge.${badge}`)}
            </Badge>
          ))}
        />
        <FeatureList
          items={SERVICE_FEATURE_LINES.map((line) => ({
            id: line,
            text: t(`service.${type}.feature.${line}`),
          }))}
        />
      </button>
      <div className="flex flex-col gap-2 ds-p-5">
        {!isSubscribed && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSelect(type)}
          >
            {t("action.demo")}
            <ChevronRight aria-hidden />
          </Button>
        )}
        {isSubscribed ? (
          <Button className="w-full" disabled>
            {t("action.inUse")}
          </Button>
        ) : (
          <Button className="w-full" onClick={onClickSubscribe}>
            {t("action.subscribe")}
          </Button>
        )}
      </div>
      {isSubscribed && (
        <Badge
          size="sm"
          className="absolute top-3 right-3 bg-slate-700/70 ds-text-xs-5-medium text-white"
        >
          {t("badge.inUse")}
        </Badge>
      )}
    </Card>
  );
}
