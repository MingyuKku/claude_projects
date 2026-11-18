import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface InfoRowProps {
  label: string;
  children: ReactNode;
  /** 필수 항목 표시(라벨 뒤 파란 `*`). */
  isRequired?: boolean;
  /** 값이 읽기 전용 텍스트가 아니라 버튼 같은 조작 요소일 때 false(흐린 톤·말줄임 없음). */
  isMuted?: boolean;
  /** MO에서 값을 라벨 아래 전체 폭으로 내림(시안의 서류 다운로드 버튼). */
  isStackedOnMobile?: boolean;
  className?: string;
}

// 읽기 전용 행: 라벨 왼쪽·값 오른쪽, 텍스트 값은 50% 흐린 톤(Figma 기본 정보·회사정보 보기).
export function InfoRow({
  label,
  children,
  isRequired = false,
  isMuted = true,
  isStackedOnMobile = false,
  className,
}: InfoRowProps) {
  return (
    <dl
      className={cn(
        "flex min-h-12 items-center gap-2 px-4",
        // 시안 MO: 라벨 칸(48px) 아래에 값 칸(48px)이 따로 있고 버튼은 칸 안에서 전체 폭.
        isStackedOnMobile &&
          "max-tablet:min-h-0 max-tablet:flex-col max-tablet:items-stretch max-tablet:gap-0",
        className,
      )}
    >
      <dt
        className={cn(
          "flex shrink-0 gap-0.5 text-sm leading-5 font-semibold text-foreground tablet:min-w-0 tablet:flex-1",
          isStackedOnMobile && "max-tablet:h-12 max-tablet:items-center",
        )}
      >
        {label}
        {isRequired && (
          <span aria-hidden="true" className="text-primary">
            *
          </span>
        )}
      </dt>
      <dd
        className={cn(
          "min-w-0 flex-1 text-right text-sm leading-5",
          isMuted ? "truncate text-foreground opacity-50" : "flex justify-end",
          isStackedOnMobile &&
            "max-tablet:h-12 max-tablet:flex-none max-tablet:items-center max-tablet:justify-stretch",
        )}
      >
        {children}
      </dd>
    </dl>
  );
}
