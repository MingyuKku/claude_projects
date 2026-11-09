import { Pencil } from "lucide-react";
import { Children } from "react";

import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { useSummaryEdit, useSummaryRejection } from "./rejection-context";

import type { ReactNode } from "react";

interface SummarySectionProps {
  /** 섹션 번호(번호 배지). */
  number: number;
  title: string;
  /** 사이드바의 "스크롤해서 보기"가 찾는 id. */
  id: string;
  children: ReactNode;
}

// 등록 내역의 섹션 카드(Figma 7555:334774·7555:401852·7555:435605): 카드 안쪽 여백 20px, 셀은 좌우 16px·세로 14px(행 높이 48px).
// PC는 왼쪽에 번호 배지 + 섹션명(320px), 오른쪽에 "라벨 | 값" 쌍 2열(열 방향으로 채움)이고, TAB·MO는 제목이 위에 오고 "라벨 | 값"이 한 줄에 하나씩 쌓임.
export function SummarySection({
  number,
  title,
  id,
  children,
}: SummarySectionProps) {
  const { t } = useTranslation("entities/campaign");
  const rejection = useSummaryRejection(number);
  const onEdit = useSummaryEdit(number);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex flex-col rounded-lg border bg-card p-4 tablet:p-5",
        // 반려된 섹션은 테두리를 진하게 하고 아래에 사유 박스를 붙임(스펙 §3 등록 내역).
        rejection !== undefined && "border-foreground/60",
      )}
    >
      <div className="flex flex-col gap-5 desktop:flex-row desktop:gap-0">
        <h3
          id={`${id}-title`}
          className="flex shrink-0 items-start gap-2 px-4 py-3 text-sm leading-6 font-medium text-foreground desktop:w-80"
        >
          {rejection !== undefined && (
            <Badge variant="red" size="sm" className="mt-0.5">
              {t("summary.rejected")}
            </Badge>
          )}
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-200 text-xs leading-5 font-medium text-blue-600"
          >
            {number}
          </span>
          {title}
        </h3>
        <dl className="flex min-w-0 flex-1 flex-col px-4">{children}</dl>
      </div>
      {rejection !== undefined && (
        <Inform
          variant="filled"
          size="sm"
          className="mt-3"
          items={[{ id: "reason", text: rejection }]}
        />
      )}
      {onEdit && (
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            {t("summary.edit")}
          </Button>
        </div>
      )}
    </section>
  );
}

interface SummaryFieldGridProps {
  children: ReactNode;
}

/**
 * 짧은 "라벨 | 값" 쌍들의 묶음. 자식은 **열 방향 순서**(왼쪽 열 위에서 아래, 그다음 오른쪽 열)로 둠: TAB·MO는 그 순서 그대로 한 줄씩 쌓이고,
 * PC는 두 열로 나눠 앞쪽 절반을 왼쪽 열에 채움. 긴 값(설명·이미지 줄)은 묶음 밖에서 `SummaryField`로 따로 둠.
 */
export function SummaryFieldGrid({ children }: SummaryFieldGridProps) {
  const count = Children.toArray(children).length;

  return (
    <div
      className="flex flex-col desktop:grid desktop:grid-flow-col desktop:grid-cols-[1.15fr_1fr] desktop:gap-x-6"
      style={{ gridTemplateRows: `repeat(${Math.ceil(count / 2)}, auto)` }}
    >
      {children}
    </div>
  );
}

interface SummaryFieldProps {
  label: string;
  /** MO에서 라벨을 값 위에 따로 놓음(이미지 줄처럼 값이 넓게 깔리는 경우). */
  isStackedOnMobile?: boolean;
  children: ReactNode;
}

// 등록 내역의 "라벨 | 값" 한 줄: 라벨은 굵게(TAB·PC 170px, MO 110px), 값은 진한 색이고 긴 값은 줄바꿈함.
export function SummaryField({
  label,
  isStackedOnMobile,
  children,
}: SummaryFieldProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start py-3.5",
        isStackedOnMobile && "max-tablet:flex-col max-tablet:gap-3",
      )}
    >
      <dt
        className={cn(
          "w-27.5 shrink-0 pr-2 text-sm leading-5 font-semibold text-foreground tablet:w-42.5",
          isStackedOnMobile && "max-tablet:w-full",
        )}
      >
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm leading-5 break-words whitespace-pre-line text-foreground">
        {children}
      </dd>
    </div>
  );
}
