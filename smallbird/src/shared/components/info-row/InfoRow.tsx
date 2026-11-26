import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// 한 줄일 때 행 높이(--info-row-h) 안에서 가운데 오는 위아래 여백. 값이 여러 줄이면 라벨이 값 첫 줄에 맞고 행이 늘어남
// (시안은 라벨을 행 가운데에 두지만 디자인팀이 상단 정렬로 정정함).
const TEXT_CELL_CLASS = "py-[calc((var(--info-row-h)_-_1lh)/2)]";

const rowVariants = cva("flex items-start px-4 [--info-row-h:3rem]", {
  variants: {
    labelWidth: {
      half: "gap-8",
      content: "gap-4",
      contentOnMobile: "gap-2",
    },
    emphasis: {
      none: "text-sm leading-5",
      value: "text-sm leading-5",
      total: "text-base leading-6 font-semibold",
    },
    // 구분선까지 포함해 행 높이 48을 유지함.
    hasDivider: {
      true: "border-b [--info-row-h:calc(3rem_-_1px)]",
      false: "",
    },
    isStackedOnMobile: {
      true: "max-tablet:flex-col max-tablet:items-stretch max-tablet:gap-0",
      false: "",
    },
  },
});

const labelVariants = cva(
  cn("flex gap-0.5 font-semibold text-foreground", TEXT_CELL_CLASS),
  {
    variants: {
      labelWidth: {
        half: "flex-1 whitespace-nowrap",
        content: "shrink-0",
        contentOnMobile: "shrink-0 tablet:min-w-0 tablet:flex-1",
      },
      isStackedOnMobile: {
        true: "max-tablet:h-12 max-tablet:items-center max-tablet:py-0",
        false: "",
      },
    },
  },
);

const valueVariants = cva("min-w-0 flex-1 text-right text-foreground", {
  variants: {
    valueType: {
      text: TEXT_CELL_CLASS,
      control: "flex min-h-(--info-row-h) items-center justify-end",
    },
    isTruncated: {
      true: "",
      false: "",
    },
    isMuted: {
      true: "opacity-50",
      false: "",
    },
    emphasis: {
      none: "",
      value: "font-semibold",
      total: "",
    },
    isStackedOnMobile: {
      true: "max-tablet:h-12 max-tablet:flex-none max-tablet:items-center max-tablet:justify-stretch",
      false: "",
    },
  },
  compoundVariants: [
    { valueType: "text", isTruncated: true, className: "truncate" },
    {
      valueType: "text",
      isTruncated: false,
      className: "flex justify-end wrap-anywhere ko:break-keep",
    },
  ],
});

interface InfoRowProps {
  label: string;
  children: ReactNode;
  /** 필수 항목 표시(라벨 뒤 파란 `*`). */
  isRequired?: boolean;
  /**
   * half: 라벨·값 칸 반반(시안).
   * content: 모든 기기에서 라벨 칸이 글자 폭. contentOnMobile: MO만 라벨 칸이 글자 폭이고 TAB 이상은 반반.
   * 둘 다 시안(모든 기기 반반)과 다르게 긴 값이 말줄임·줄바꿈되지 않도록 값 칸을 넓힌 배치.
   */
  labelWidth?: "half" | "content" | "contentOnMobile";
  /** text: 글자 값. control: 버튼·배지 같은 조작 요소(행 가운데 정렬). */
  valueType?: "text" | "control";
  /** 글자 값을 한 줄 말줄임으로 둠. 끄면 줄바꿈함. */
  isTruncated?: boolean;
  /** 값을 50% 흐린 톤으로 둠(시안의 읽기 전용 보기). */
  isMuted?: boolean;
  /** value: 값만 굵게. total: 라벨·값 모두 크고 굵게(합계 행). */
  emphasis?: "none" | "value" | "total";
  /** 행 아래 구분선. */
  hasDivider?: boolean;
  /** MO에서 값을 라벨 아래 전체 폭으로 내림(시안의 서류 다운로드 버튼). */
  isStackedOnMobile?: boolean;
  className?: string;
}

// 읽기 전용 정보 행: 라벨 왼쪽·값 오른쪽(시안의 Table Row + Table Base / Cell).
export function InfoRow({
  label,
  children,
  isRequired = false,
  labelWidth = "half",
  valueType = "text",
  isTruncated = false,
  isMuted = false,
  emphasis = "none",
  hasDivider = false,
  isStackedOnMobile = false,
  className,
}: InfoRowProps) {
  return (
    <dl
      className={cn(
        rowVariants({ labelWidth, emphasis, hasDivider, isStackedOnMobile }),
        className,
      )}
    >
      <dt className={labelVariants({ labelWidth, isStackedOnMobile })}>
        {label}
        {isRequired && (
          <span aria-hidden="true" className="text-primary">
            *
          </span>
        )}
      </dt>
      <dd
        className={valueVariants({
          valueType,
          isTruncated,
          isMuted,
          emphasis,
          isStackedOnMobile,
        })}
      >
        {children}
      </dd>
    </dl>
  );
}
