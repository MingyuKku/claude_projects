import { CircleAlert, Check } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

import type { ReactNode } from "react";

// Figma Sidebar / Sub(7432:199272)·Sidebar Sub Base / Toggle(7701:247853)·Sidebar / Sub / Mobile(7701:251947).
// 8단계 같은 작업 단계를 세로 목록으로 보이고 어느 단계로든 이동하게 함. 가로 진행 표시(`Stepper`)와는 모양이 다름.
// - current: 파란 포커스 링. done: 번호 대신 파란 체크. visited: 번호(가 봤거나 건너뛴 단계). unvisited: 아직 안 간 단계라 흐림.
// - 건너뛰었거나 가 봤는데 필수 입력이 비어 있는 단계는 느낌표 + 빨간 테두리(`hasAlert`). 시안이 오면 모양을 맞춤(스펙 D-12).

export type StepSidebarItemState = "current" | "done" | "visited" | "unvisited";

export interface StepSidebarItem {
  id: string;
  label: string;
  /** 번호 배지. 번호가 없는 항목(기본정보)은 넘기지 않음. */
  number?: number;
  state: StepSidebarItemState;
  hasAlert?: boolean;
  /** 느낌표의 스크린 리더용 설명. */
  alertLabel?: string;
  /** 단계 안에서 작업이 진행 중임(AI 생성 등). 느낌표 자리에 로딩 표시를 보임(스펙 D-12, 시안 오면 교체). */
  isBusy?: boolean;
  /** 로딩 표시의 스크린 리더용 설명. */
  busyLabel?: string;
}

interface StepSidebarProps {
  items: StepSidebarItem[];
  onSelect: (id: string) => void;
  /** 목록 맨 위의 항목(등록 내역의 "기본정보")과 구분선. */
  header?: Pick<StepSidebarItem, "id" | "label"> & { isCurrent: boolean };
  /** md는 PC·TAB 사이드바, sm은 모바일 드로어(항목 안쪽 여백이 작음). */
  size?: "md" | "sm";
  navLabel: string;
  className?: string;
}

// Figma는 테두리를 안쪽에 그려서 항목 높이가 안쪽 여백 × 2 + 글줄 높이(md 14·14 + 20 = 48, sm 10·10 + 20 = 40)임.
// CSS 테두리(1px)가 바깥에 더해지므로 그만큼 여백을 줄이고 최소 높이로 맞춤.
const ITEM_SIZE_CLASS = {
  md: "min-h-12 px-3.75 py-3",
  sm: "min-h-10 px-2.75 py-2",
} as const;

// Figma focus ring/2px - Primary(2px 배경색 + 2px 파란색).
const FOCUS_RING_CLASS = "ring-2 ring-primary ring-offset-2";

function StepSymbol({
  number,
  isDone,
}: {
  number: number;
  isDone: boolean;
}): ReactNode {
  // Stepper Base / Step Symbol(sm): 20px 배지. 완료는 파란 바탕에 체크.
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md text-xs leading-5 font-medium",
        isDone ? "bg-primary text-blue-100" : "bg-blue-200 text-blue-600",
      )}
    >
      {isDone ? <Check className="size-3" /> : number}
    </span>
  );
}

export function StepSidebar({
  items,
  onSelect,
  header,
  size = "md",
  navLabel,
  className,
}: StepSidebarProps) {
  return (
    <nav
      aria-label={navLabel}
      className={cn(
        "flex flex-col",
        size === "md" ? "gap-4" : "gap-3",
        className,
      )}
    >
      {header && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            aria-current={header.isCurrent ? "step" : undefined}
            onClick={() => onSelect(header.id)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background text-left text-sm leading-5 font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              ITEM_SIZE_CLASS[size],
              header.isCurrent && FOCUS_RING_CLASS,
            )}
          >
            <span className="min-w-px flex-1">{header.label}</span>
          </button>
          <hr className="border-border" />
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={item.state === "current" ? "step" : undefined}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md border bg-background text-left text-sm leading-5 font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                item.hasAlert ? "border-destructive" : "border-input",
                ITEM_SIZE_CLASS[size],
                item.state === "current" && FOCUS_RING_CLASS,
              )}
            >
              <span
                className={cn(
                  "flex min-w-px flex-1 items-center gap-2",
                  item.state === "unvisited" && "opacity-50",
                )}
              >
                {item.number !== undefined && (
                  <StepSymbol
                    number={item.number}
                    isDone={item.state === "done"}
                  />
                )}
                <span className="min-w-px flex-1">{item.label}</span>
              </span>
              {item.isBusy && (
                <>
                  <Spinner aria-hidden className="shrink-0 text-primary" />
                  {item.busyLabel && (
                    <span className="sr-only">{item.busyLabel}</span>
                  )}
                </>
              )}
              {item.hasAlert && (
                <>
                  <CircleAlert
                    aria-hidden
                    className="size-4 shrink-0 text-destructive"
                  />
                  {item.alertLabel && (
                    <span className="sr-only">{item.alertLabel}</span>
                  )}
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
