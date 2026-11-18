import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface EmptyTableFrameProps {
  /** 머리글만 있는 표. 바깥 테두리는 이 틀이 그리므로 표의 테두리는 끄고 넘김. 머리글이 없는 시안(TAB)은 생략. */
  table?: ReactNode;
  /** 표 아래 본문 자리에 그릴 빈 상태. */
  children: ReactNode;
  className?: string;
}

// 빈 표: 머리글은 그대로 두고, 아래 안내가 남은 높이를 채워 화면 전체 스크롤이 생기지 않게 함.
// 표 칸(<td>)은 부모 높이를 따라 늘일 수 없어 안내를 표 밖에 두고 같은 테두리로 감쌈.
export function EmptyTableFrame({
  table,
  children,
  className,
}: EmptyTableFrameProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-lg border border-border",
        className,
      )}
    >
      {table}
      {children}
    </div>
  );
}
