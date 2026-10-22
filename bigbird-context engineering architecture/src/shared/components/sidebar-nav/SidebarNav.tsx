import { cva } from "class-variance-authority";
import { FileQuestionMark, PanelLeft, Plus } from "lucide-react";

import logo from "@/shared/assets/img/brand/logo.svg";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { SidebarNavItem, SidebarRailItem } from "./SidebarNavItem";

import type {
  SidebarLinkComponent,
  SidebarNavItemData,
} from "./SidebarNavItem";
import type { ReactNode } from "react";

// Figma Sidebar(5058:76567): 펼침 230px(Open / Close=False) · 레일 56px(Open / Close=True).
// 배경은 Figma의 muted/40을 흰 배경 위에 겹친 값.
interface SidebarNavProps {
  items: SidebarNavItemData[];
  logoAlt: string;
  logoHref?: string;
  logoLinkLabel?: string;
  isCollapsed?: boolean;
  toggleLabel: string;
  onClickToggle?: () => void;
  // 상단 주요 버튼 (예: 캠페인 등록하기). 레일에서는 아이콘 버튼으로 표시
  primaryActionLabel?: string;
  onClickPrimaryAction?: () => void;
  isPrimaryActionDisabled?: boolean;
  // 하단 이용 가이드 버튼 (Figma Guide Button). 레일에서는 숨김
  guideLabel?: string;
  onClickGuide?: () => void;
  isGuideDisabled?: boolean;
  // 이용 가이드 옆에 붙는 추가 요소 (예: 개발용 언어 전환)
  guideExtra?: ReactNode;
  navLabel: string;
  // SPA 라우터 링크를 쓰려면 href를 받는 컴포넌트를 넘김 (기본 <a>)
  linkAs?: SidebarLinkComponent;
  className?: string;
}

const sidebarVariants = cva(
  "flex h-full flex-col border-r bg-[color-mix(in_srgb,var(--color-muted)_40%,var(--color-background))]",
  {
    variants: {
      isCollapsed: { true: "w-14", false: "w-57.5" },
    },
  },
);

const sidebarBodyVariants = cva(
  "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
  {
    variants: {
      isCollapsed: { true: "p-2", false: "px-2.5" },
    },
  },
);

export function SidebarNav({
  items,
  logoAlt,
  logoHref,
  logoLinkLabel,
  isCollapsed = false,
  toggleLabel,
  onClickToggle,
  primaryActionLabel,
  onClickPrimaryAction,
  isPrimaryActionDisabled = false,
  guideLabel,
  onClickGuide,
  isGuideDisabled = false,
  guideExtra,
  navLabel,
  linkAs,
  className,
}: SidebarNavProps) {
  const LogoLink = linkAs ?? "a";
  const logoImage = <img src={logo} alt={logoAlt} className="h-5 w-22.5" />;
  const toggleButton = (
    <Button
      variant="ghost-foreground"
      size={isCollapsed ? "icon" : "icon-xs"}
      className="cursor-pointer"
      aria-label={toggleLabel}
      aria-expanded={!isCollapsed}
      onClick={onClickToggle}
    >
      <PanelLeft />
    </Button>
  );

  const logoContent = logoHref ? (
    <LogoLink
      href={logoHref}
      aria-label={logoLinkLabel}
      className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {logoImage}
    </LogoLink>
  ) : (
    logoImage
  );
  const header = isCollapsed ? (
    <div className="px-2 pt-3.5 pb-1.5">{toggleButton}</div>
  ) : (
    <div className="flex items-center justify-between py-4 pr-3.5 pl-4 tablet:py-5 tablet:pl-5">
      {logoContent}
      {toggleButton}
    </div>
  );
  const primaryAction = isCollapsed ? (
    <Button
      variant="outline"
      size="icon"
      className="w-full disabled:opacity-100"
      aria-label={primaryActionLabel}
      onClick={onClickPrimaryAction}
      disabled={isPrimaryActionDisabled}
    >
      <Plus />
    </Button>
  ) : (
    <Button
      variant="outline"
      className="w-full disabled:opacity-100"
      onClick={onClickPrimaryAction}
      disabled={isPrimaryActionDisabled}
    >
      <Plus />
      {primaryActionLabel}
    </Button>
  );

  return (
    <aside className={cn(sidebarVariants({ isCollapsed }), className)}>
      {header}
      <div className={sidebarBodyVariants({ isCollapsed })}>
        {primaryActionLabel && primaryAction}
        <nav aria-label={navLabel}>
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.id}>
                {isCollapsed ? (
                  <SidebarRailItem item={item} linkAs={linkAs} />
                ) : (
                  <SidebarNavItem item={item} linkAs={linkAs} />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {guideLabel && !isCollapsed && (
        <div className="hidden items-center gap-1 px-2.5 pt-2.5 pb-4 tablet:flex">
          <Button
            variant="ghost-muted"
            size="sm"
            className="cursor-pointer"
            onClick={onClickGuide}
            disabled={isGuideDisabled}
          >
            <FileQuestionMark />
            {guideLabel}
          </Button>
          {guideExtra}
        </div>
      )}
    </aside>
  );
}
