import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma Chat Base / Chat Devider(6790:120136): 날짜 구분(Date)과 삭제된 메시지 안내(Removed)에 쓰는 알약.
interface ChatDividerProps {
  children: ReactNode;
  className?: string;
}

export function ChatDivider({ children, className }: ChatDividerProps) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs leading-4 font-semibold whitespace-nowrap text-slate-400",
        className,
      )}
    >
      {children}
    </p>
  );
}
