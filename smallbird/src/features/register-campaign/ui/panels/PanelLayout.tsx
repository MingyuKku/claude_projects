import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// 하위 화면 내용의 공통 배치: 스크롤하는 본문 + 아래 고정 버튼 영역. 드로어(PC)와 서브 화면(TAB·MO)이 같은 내용을 씀.
// 여백은 시안이 PC·TAB 20px(항목 간격 16, Button Area 80), MO 16px(항목 간격 12, 70)임.
export function PanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 tablet:gap-4 tablet:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelFooter({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 gap-3 p-4 tablet:p-5">{children}</div>;
}
