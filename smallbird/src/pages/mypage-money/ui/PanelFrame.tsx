import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface PanelFrameProps {
  /** aside: PC의 오른쪽 인라인 패널(시안 377px), screen: TAB·MO에서 본문을 대체하는 카드. */
  variant: "aside" | "screen";
  children: ReactNode;
}

export function PanelFrame({ variant, children }: PanelFrameProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border",
        variant === "aside" && "w-94.25 shrink-0 self-stretch",
        variant === "screen" && "min-h-0 flex-1",
      )}
    >
      {children}
    </div>
  );
}
