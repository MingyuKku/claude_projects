import { TextAlignJustify } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma Header / Main(5045:50670, PC 1210×64)·Header / Main / Mobile(5084:122374, 360×52).
// 모바일 시안에는 제목이 없어 화면에서는 숨기고 스크린 리더용 h1로만 남김. 고객센터처럼 모바일 시안에 제목이 있는 화면은 `isTitleVisibleOnMobile`로 보여 줌.
// PC 헤더 레이아웃은 사이드바 레일이 노출되는 tablet(768)부터 적용함. 그 아래에서는 메뉴 버튼으로 사이드바를 엶.
interface AppHeaderProps {
  title?: string;
  // PC에서 제목 앞에 붙는 20px 아이콘 (모바일 시안에는 없음)
  icon?: ReactNode;
  /** 모바일에서도 제목을 보여 줌(기본은 숨김). */
  isTitleVisibleOnMobile?: boolean;
  menuLabel: string;
  onClickMenu?: () => void;
  // 오른쪽 영역: HeaderPointButton·HeaderAlertButton·UserMenu 또는 HeaderGuestActions
  children?: ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  icon,
  isTitleVisibleOnMobile = false,
  menuLabel,
  onClickMenu,
  children,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-13 items-center justify-between gap-2 bg-background py-1 pr-4 pl-1.5 tablet:h-16 tablet:p-5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center tablet:gap-2">
        <button
          type="button"
          aria-label={menuLabel}
          onClick={onClickMenu}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 tablet:hidden"
        >
          {/* Figma 예외: 메뉴 아이콘 선 1.5px(전역 1px 규칙과 다름). */}
          <TextAlignJustify className="size-6" strokeWidth={1.5} />
        </button>
        {icon && (
          <span className="hidden shrink-0 text-foreground tablet:flex [&_svg]:size-5">
            {icon}
          </span>
        )}
        {title && (
          <h1
            className={cn(
              "truncate text-base leading-6 font-semibold text-foreground tablet:not-sr-only tablet:text-xl tablet:leading-none tablet:tracking-[-0.6px]",
              !isTitleVisibleOnMobile && "sr-only",
            )}
          >
            {title}
          </h1>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </header>
  );
}
