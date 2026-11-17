import { cva } from "class-variance-authority";
import { CircleAlert, FilePenLine } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

// Figma `Sidebar Sub Base / Toggle`(단계 메뉴 한 칸, md 48 · sm 40)의 목록. 캠페인 등록 사이드바 상태 모음(13320:132889) 기준.
// 현재 단계는 파란 링(포커스 모양), 비활성은 번호·이름만 흐리게, 오른쪽 표시는 입력 중(연필)·필수 미입력(빨간 느낌표) 두 가지.

export type StepSidebarItemState = "default" | "current" | "disabled";
export type StepSidebarIndicator = "editing" | "warning";

export interface StepSidebarItem {
  id: string;
  number: number;
  label: string;
  state: StepSidebarItemState;
  indicator?: StepSidebarIndicator | null;
}

const itemVariants = cva(
  "flex w-full cursor-pointer items-center gap-2 rounded-md border bg-background text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default disabled:hover:bg-background",
  {
    variants: {
      size: {
        md: "h-12 px-4 py-3.5",
        sm: "h-10 px-3 py-2.5",
      },
      isCurrent: {
        true: "ring-2 ring-primary ring-offset-2",
        false: "",
      },
    },
  },
);

/** 단계 목록 위에 따로 붙는 항목(캠페인 등록 내역의 "기본정보"). 번호 없이 이름만 있고 아래에 구분선이 붙음. */
export interface StepSidebarOverviewItem {
  id: string;
  label: string;
  isCurrent: boolean;
}

interface StepSidebarProps {
  /** 목록 이름(스크린 리더). */
  label: string;
  items: readonly StepSidebarItem[];
  overviewItem?: StepSidebarOverviewItem;
  size?: "md" | "sm";
  /** 오른쪽 표시 아이콘의 스크린 리더 문구. */
  indicatorLabels: Record<StepSidebarIndicator, string>;
  onSelect: (id: string) => void;
  className?: string;
}

export function StepSidebar({
  label,
  items,
  overviewItem,
  size = "md",
  indicatorLabels,
  onSelect,
  className,
}: StepSidebarProps) {
  return (
    <nav aria-label={label} className={className}>
      {overviewItem && (
        <>
          <button
            type="button"
            aria-current={overviewItem.isCurrent ? "page" : undefined}
            className={itemVariants({
              size,
              isCurrent: overviewItem.isCurrent,
            })}
            onClick={() => onSelect(overviewItem.id)}
          >
            <span className="min-w-0 flex-1 truncate ds-text-sm-5-medium text-foreground">
              {overviewItem.label}
            </span>
          </button>
          <hr className="my-4 border-border" />
        </>
      )}
      <ol className="flex flex-col gap-2">
        {items.map((item) => {
          const isDisabled = item.state === "disabled";
          const isCurrent = item.state === "current";
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={isDisabled}
                aria-current={isCurrent ? "step" : undefined}
                className={itemVariants({ size, isCurrent })}
                onClick={() => onSelect(item.id)}
              >
                <Badge
                  size="sm"
                  className={cn(
                    "size-5 justify-center",
                    isDisabled && "opacity-50",
                  )}
                >
                  {item.number}
                </Badge>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate ds-text-sm-5-medium text-foreground",
                    isDisabled && "opacity-50",
                  )}
                >
                  {item.label}
                </span>
                {item.indicator === "editing" && (
                  <FilePenLine
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-label={indicatorLabels.editing}
                    role="img"
                  />
                )}
                {item.indicator === "warning" && (
                  <CircleAlert
                    className="size-4 shrink-0 text-destructive"
                    aria-label={indicatorLabels.warning}
                    role="img"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
