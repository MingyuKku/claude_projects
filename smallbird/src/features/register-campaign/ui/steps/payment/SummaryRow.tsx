import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface SummaryRowProps {
  label: string;
  children: ReactNode;
  /** 총 결제 금액처럼 값을 굵고 크게 보임. */
  isEmphasized?: boolean;
}

// 결제 카드의 라벨·값 행(Figma 7555:334661): 높이 48px·좌우 16px 안쪽 여백, 라벨은 왼쪽, 값은 오른쪽 정렬이고 긴 값은 줄바꿈함.
export function SummaryRow({ label, children, isEmphasized }: SummaryRowProps) {
  return (
    <dl className="flex min-h-12 items-center justify-between gap-4 px-4 text-sm leading-5">
      <dt
        className={cn(
          "shrink-0 font-semibold text-foreground",
          isEmphasized && "text-base leading-6 font-bold",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-right break-keep text-foreground",
          isEmphasized && "text-base leading-6 font-bold",
        )}
      >
        {children}
      </dd>
    </dl>
  );
}
