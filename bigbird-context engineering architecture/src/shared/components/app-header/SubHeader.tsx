import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

// Figma Header / Sub(5198:110453, PC)·Header / Sub / Mobile(6791:55626, 360).
// variant = Figma Type: default(제목+닫기), chat(판매자·구매자 Chat), list(목록 제목+버튼), download(어두운 뷰어 헤더).
const subHeaderVariants = cva("flex w-full items-center", {
  variants: {
    variant: {
      default:
        "h-13.5 justify-between gap-2 overflow-hidden border-b bg-background py-1.5 pr-1 pl-4 tablet:h-15 tablet:pr-2 tablet:pl-5",
      chat: "flex-col items-stretch justify-center gap-2 border-b bg-background px-4 pt-2 pb-3 tablet:h-15 tablet:flex-row tablet:items-center tablet:px-5 tablet:py-3",
      list: "h-13.5 justify-between bg-background px-4 pt-2 pb-3 tablet:h-15 tablet:px-5 tablet:py-3",
      download:
        "h-13 justify-between overflow-hidden bg-slate-800 py-1.5 pr-2.5 pl-4 tablet:h-20 tablet:py-4 tablet:pr-5 tablet:pl-8",
    },
  },
  defaultVariants: { variant: "default" },
});

const titleGroupVariants = cva("flex min-w-0 items-center", {
  variants: {
    variant: {
      default:
        "flex-1 gap-3 text-base leading-none font-semibold text-card-foreground",
      chat: "flex-1 gap-3 text-card-foreground",
      list: "gap-1 text-base leading-none font-semibold text-foreground",
      download:
        "gap-2 text-base leading-none font-semibold text-background tablet:text-xl tablet:tracking-[-0.6px]",
    },
  },
  defaultVariants: { variant: "default" },
});

interface SubHeaderProps extends VariantProps<typeof subHeaderVariants> {
  // 제목 영역 (제목 문자열, 배지·아바타, 제목 옆 아이콘 버튼 등)
  title: ReactNode;
  // 오른쪽 영역 (닫기 버튼, 상담일, 버튼 등). chat 모바일에서는 제목 아래 줄로 내려감.
  actions?: ReactNode;
  className?: string;
}

export function SubHeader({
  variant,
  title,
  actions,
  className,
}: SubHeaderProps) {
  return (
    <header className={cn(subHeaderVariants({ variant }), className)}>
      <div className={cn(titleGroupVariants({ variant }))}>{title}</div>
      {actions}
    </header>
  );
}
