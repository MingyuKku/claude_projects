import { ChevronDown, ChevronUp, TriangleAlert } from "lucide-react";

import { EmptyIllustration } from "@/shared/components/empty-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Button(6897:43929): Type(Default/Subscribe/Disabled) × State(Default/Hover/Focus/More).
// Subscribe는 primary 1px 외곽선과 비활성 "구독 중" 버튼, Disabled는 준비중 안내와 비활성 버튼.
export type PlanCardType = "default" | "subscribed" | "disabled";

export interface PlanCardFeature {
  id: string;
  text: ReactNode;
}

interface PlanCardProps extends Omit<ComponentProps<"div">, "title"> {
  type?: PlanCardType;
  title: ReactNode;
  price: ReactNode;
  /** 가격 아래 배지 묶음(`<Badge>` 여러 개) */
  badges?: ReactNode;
  features?: PlanCardFeature[];
  /** Disabled 타입의 본문 안내 문구 */
  comingSoonText?: ReactNode;
  /** 펼친(More) 상태에서 기능 목록 아래에 보일 상세 내용 */
  detail?: ReactNode;
  isExpanded?: boolean;
  detailLabel?: ReactNode;
  onClickDetail?: () => void;
  actionLabel: ReactNode;
  onClickAction?: () => void;
}

export function PlanCard({
  type = "default",
  title,
  price,
  badges,
  features = [],
  comingSoonText,
  detail,
  isExpanded = false,
  detailLabel,
  onClickDetail,
  actionLabel,
  onClickAction,
  className,
  ...props
}: PlanCardProps) {
  const isDisabled = type === "disabled";
  const isExpandedWithDetail = isExpanded && Boolean(detail);
  const DetailIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <Card
      interactive={!isDisabled}
      className={cn(type === "subscribed" && "ring-1 ring-primary", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 px-5 pt-5">
        <p
          className={cn(
            "text-lg leading-none font-semibold tracking-[-0.45px]",
            isDisabled ? "text-muted-foreground" : "text-primary",
          )}
        >
          {title}
        </p>
        <p className="text-2xl leading-none font-semibold tracking-[-0.6px]">
          {price}
        </p>
        {badges && <div className="flex gap-2">{badges}</div>}
        <Separator />
      </div>

      {isDisabled ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-5 text-center text-sm leading-5 text-muted-foreground">
          <EmptyIllustration type="construction" className="size-5" />
          {comingSoonText}
        </div>
      ) : (
        <ul
          className={cn(
            "flex flex-col gap-2 px-5 pt-5",
            isExpandedWithDetail ? "pb-5" : "flex-1",
          )}
        >
          {features.map((feature) => (
            <li
              key={feature.id}
              className="flex items-start gap-1.5 text-sm leading-5 text-foreground"
            >
              <span className="flex size-3 shrink-0 translate-y-1 items-center justify-center">
                <span className="size-1.5 rounded-full bg-foreground" />
              </span>
              <span className="min-w-0 flex-1">{feature.text}</span>
            </li>
          ))}
        </ul>
      )}

      {isExpandedWithDetail && (
        <div className="flex flex-1 flex-col gap-5 px-5">{detail}</div>
      )}

      <div className={cn("flex flex-col p-5", isDisabled ? "gap-1" : "gap-2")}>
        {!isDisabled && detailLabel && (
          <Button
            variant="outline"
            className="w-full"
            aria-expanded={isExpanded}
            onClick={onClickDetail}
          >
            {detailLabel}
            <DetailIcon aria-hidden />
          </Button>
        )}
        <Button
          className="w-full"
          disabled={type !== "default"}
          onClick={onClickAction}
        >
          {isDisabled && <TriangleAlert aria-hidden />}
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
