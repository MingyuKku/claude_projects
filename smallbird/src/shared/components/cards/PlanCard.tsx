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
  /** 가격 위에 줄을 그어 보이는 할인 전 가격 */
  originalPrice?: ReactNode;
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
  originalPrice,
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
  const titleNode = (
    <p
      className={cn(
        "text-lg leading-none font-semibold tracking-[-0.45px]",
        isDisabled ? "text-muted-foreground" : "text-primary",
      )}
    >
      {title}
    </p>
  );
  const priceNode = (
    <p className="text-xl leading-none font-semibold tracking-[-0.6px] tablet:text-2xl">
      {price}
    </p>
  );

  return (
    <Card
      interactive={!isDisabled}
      className={cn(type === "subscribed" && "ring-1 ring-primary", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-3 px-4 pt-4 tablet:gap-4 tablet:px-5 tablet:pt-5">
        {originalPrice ? (
          // 할인 전 가격이 있는 시안(11755:97086)은 제목과 가격 묶음 사이가 12px로 좁음.
          <div className="flex flex-col items-center gap-3">
            {titleNode}
            <div className="flex flex-col items-center">
              <p className="text-sm leading-5 text-muted-foreground line-through">
                {originalPrice}
              </p>
              {priceNode}
            </div>
          </div>
        ) : (
          <>
            {titleNode}
            {priceNode}
          </>
        )}
        {badges && <div className="flex gap-2">{badges}</div>}
        <Separator />
      </div>

      {isDisabled ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-4 text-center text-sm leading-4 text-muted-foreground tablet:p-5 tablet:leading-5">
          <EmptyIllustration type="construction" className="size-5" />
          {comingSoonText}
        </div>
      ) : (
        <ul
          className={cn(
            "flex flex-col gap-2 px-4 pt-4 tablet:px-5 tablet:pt-5",
            !isExpandedWithDetail && "flex-1",
          )}
        >
          {features.map((feature) => (
            <li
              key={feature.id}
              className="flex items-start gap-1.5 text-sm leading-4 text-foreground tablet:leading-5"
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
        // 위 여백(pt-5)을 이 영역 안에 둬야 목록의 카드 높이 맞춤이 펼침 영역 높이만 빼서 접힌 높이를 잴 수 있음.
        <div
          data-slot="plan-card-detail"
          className="flex flex-1 flex-col gap-5 px-4 pt-4 tablet:px-5 tablet:pt-5"
        >
          {detail}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col p-4 tablet:p-5",
          isDisabled ? "gap-1" : "gap-2",
        )}
      >
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
