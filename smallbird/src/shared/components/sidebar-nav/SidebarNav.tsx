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
  // 접힌 레일에서 하위 메뉴가 있는 항목을 눌렀을 때. 넘기면 이동하지 않고 이 함수를 부름(사이드바를 펼치고 그 그룹을 열 때 씀)
  onClickRailGroup?: (itemId: string) => void;
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
  // 이용 가이드 아래 전체 폭 요소 (Figma Footer의 Toggle / Tab, 예: 광고주·인플루언서 전환). 레일에서는 숨김
  footerSwitch?: ReactNode;
  navLabel: string;
  // SPA 라우터 링크를 쓰려면 href를 받는 컴포넌트를 넘김 (기본 <a>)
  linkAs?: SidebarLinkComponent;
  className?: string;
}

// 오른쪽 선은 border가 아니라 안쪽 그림자로 그림: Figma는 선이 프레임 안쪽에 그려져 안쪽 여백(10px)에 영향을 주지 않으므로
// 메인 메뉴 210px·서브 메뉴 177px이 되려면 선이 레이아웃 폭을 차지하면 안 됨(border-r는 1px을 빼 209·176px이 됨).
const sidebarVariants = cva(
  "flex h-full flex-col bg-[color-mix(in_srgb,var(--color-muted)_40%,var(--color-background))] shadow-[inset_-1px_0_0_var(--color-border)]",
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
  onClickRailGroup,
  toggleLabel,
  onClickToggle,
  primaryActionLabel,
  onClickPrimaryAction,
  isPrimaryActionDisabled = false,
  guideLabel,
  onClickGuide,
  isGuideDisabled = false,
  guideExtra,
  footerSwitch,
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
                  <SidebarRailItem
                    item={item}
                    linkAs={linkAs}
                    onClickGroup={onClickRailGroup}
                  />
                ) : (
                  <SidebarNavItem item={item} linkAs={linkAs} />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Figma Footer(5058:74731): 이용 가이드 아래 전환 탭, 간격 10, 위 10·아래 16·좌우 10 */}
      {(guideLabel || footerSwitch) && !isCollapsed && (
        <div className="flex flex-col items-start gap-2.5 px-2.5 pt-2.5 pb-4">
          {guideLabel && (
            <div className="flex items-center gap-1">
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
          {footerSwitch}
        </div>
      )}
    </aside>
  );
}
