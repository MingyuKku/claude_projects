import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { AppHeader } from "@/shared/components/app-header";
import { LoginRequiredAlert } from "@/shared/components/login-required-alert";
import { SidebarNav } from "@/shared/components/sidebar-nav";
import { ToggleTab } from "@/shared/components/toggle-tab";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { CLIENT_GUIDE_URL } from "../model/navigation";
import { NavigationContext } from "../model/navigation-context";
import { useSidebarStore } from "../model/sidebar-store";
import { useKeyboardAwareShell } from "../model/useKeyboardAwareShell";
import { useMobileMenu } from "../model/useMobileMenu";
import { useScrollRestoration } from "../model/useScrollRestoration";
import { useShellNavItems } from "../model/useShellNavItems";
import { DevLanguageSwitcher } from "./DevLanguageSwitcher";
import { ShellHeaderActions } from "./ShellHeaderActions";
import { ShellLink } from "./ShellLink";

import type { ShellNavId } from "../model/navigation";
import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

const CUSTOMER_CENTER_PATH_PREFIXES: string[] = [
  ROUTES.customerCenterBigbird,
  ROUTES.customerCenterBuyer,
  ROUTES.customerCenterInfluencer,
];
// 고객센터는 모바일에서 본문이 가장자리까지 차고, 태블릿 이상에서는 위쪽 여백 없이 좌우·아래만 둠.
const CUSTOMER_CENTER_MAIN_CLASS =
  "p-0 tablet:px-5 tablet:py-0 tablet:pb-5 desktop:px-5 desktop:pb-5";

// iOS에서 키보드가 떠 있는 동안 본문 아래 끝은 보이는 영역의 아래 끝이고, 그 아래로 반투명한 주소·입력 보조 막대가 셸 아래 블록을 비춤.
// 본문을 스크롤하면 내용이 그 끝에서 잘린 듯 끊겨 보이므로 아래를 흐리게 함. 흐리는 길이는 키보드가 열릴 때 입력 영역을 띄우는
// 아래 여백(--keyboard-anchor-gap)과 같아 스크롤하지 않은 상태의 입력 영역은 흐려지지 않음.
const KEYBOARD_FITTED_MAIN_CLASS =
  "mask-[linear-gradient(to_bottom,black_calc(100%-var(--keyboard-anchor-gap)),transparent)]";

interface AppShellProps {
  session: SessionViewModel | null;
  /** 헤더 제목. 넘기지 않으면 `activeNavId`(없으면 홈) 메뉴 이름. */
  title?: string;
  /** 헤더 제목 앞 아이콘. 넘기지 않으면 `activeNavId` 메뉴의 아이콘. */
  icon?: ReactNode;
  /** 모바일 헤더에도 제목을 보여 줌. 모바일 시안에 제목이 있는 화면(고객센터)에서 씀. */
  isTitleVisibleOnMobile?: boolean;
  /**
   * LNB에서 활성으로 표시할 메뉴. 넘기지 않으면 `href`가 현재 경로와 같은 메뉴.
   * 시안이 없는 화면을 임시로 특정 메뉴 아래에 둘 때 씀.
   */
  activeNavId?: ShellNavId;
  children: ReactNode;
  className?: string;
  /** `<main>` 여백을 바꿈. 기본은 p-5이고, 배경이 영역을 꽉 채우는 화면은 "p-0"을 넘김. */
  mainClassName?: string;
  /**
   * 가상 키보드가 떠 있는지를 셸 루트의 `data-keyboard="open"`으로 알림. 본문은 Tailwind `in-data-[keyboard=open]:`으로 키보드 열림 배치를 정하고,
   * 키보드가 열릴 때 보이게 할 영역에 `data-keyboard-anchor`를 두고, 그 아래 끝과 보이는 영역 아래 끝 사이 여백을 `--keyboard-anchor-gap`으로 맞춤
   * (앵커의 `scroll-mb-(--keyboard-anchor-gap)`, 또는 앵커가 감싼 내용 아래 패딩). 키보드가 열리면 셸이 보이는 영역만큼 줄어듦(Android는 index.html의
   * `interactive-widget=resizes-content`, 이를 지원하지 않는 iOS Safari는 셸을 visualViewport 높이에 맞춤). 규칙은 `.claude/skills/mobile-keyboard/SKILL.md`.
   */
  isKeyboardAware?: boolean;
  /**
   * iOS에서 키보드가 떠 있는 동안 본문 아래 끝과 셸 아래(키보드 뒤)를 칠할 배경. 기본은 셸 배경(bg-background)이고, 본문 배경이 다른 화면이 넘김.
   * 셸 아래 블록과 이어지도록 세로로 변하지 않는 배경(단색·가로 그라데이션)이어야 함.
   */
  keyboardGapClassName?: string;
}

export function AppShell({
  session,
  children,
  className,
  mainClassName,
  title,
  icon,
  isTitleVisibleOnMobile,
  activeNavId,
  isKeyboardAware = false,
  keyboardGapClassName = "bg-background",
}: AppShellProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    rootProps: keyboardRootProps,
    gapPaintStyle,
    isFittedToViewport,
  } = useKeyboardAwareShell(isKeyboardAware);
  const mainRef = useRef<HTMLElement>(null);
  useScrollRestoration(mainRef);
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);
  const {
    items: shellItems,
    activeNavItem,
    currentNavItem,
    currentSubItem,
  } = useShellNavItems(activeNavId);
  const {
    isMenuOpen,
    setIsMenuOpen,
    openMenu,
    closeMenu,
    handleCloseAutoFocus,
  } = useMobileMenu();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const expandSidebar = useSidebarStore((state) => state.expand);
  // 레일에서 눌러 사이드바를 펼칠 때 함께 열 그룹. 펼친 메뉴는 그룹을 처음 그릴 때 이 값을 보므로,
  // 사이드바를 여는 모든 경로(아래 핸들러)가 이 값을 정하거나 비움.
  const [expandedNavId, setExpandedNavId] = useState<ShellNavId | null>(null);
  const items = shellItems.map((item) =>
    item.id === expandedNavId ? { ...item, isDefaultOpen: true } : item,
  );

  const isAdmin = session?.authority === "ADMIN";
  const isCustomerCenterPath = CUSTOMER_CENTER_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const activeNavTitle = activeNavItem
    ? t(`nav.${activeNavItem.id}`)
    : (currentSubItem?.label ?? t("nav.home"));
  const headerTitle = title ?? activeNavTitle;

  // 하위 메뉴가 있는 레일 항목은 이동하지 않고 사이드바를 펼친 뒤 그 그룹을 엶(디자인팀 QA 2026-11-06).
  function findNavId(itemId: string) {
    return shellItems.find((item) => item.id === itemId)?.id ?? null;
  }

  function handleClickDesktopRailGroup(itemId: string) {
    setExpandedNavId(findNavId(itemId));
    expandSidebar();
  }

  function handleClickTabletRailGroup(itemId: string) {
    setExpandedNavId(findNavId(itemId));
    openMenu();
  }

  function handleToggleDesktopSidebar() {
    setExpandedNavId(null);
    toggleCollapsed();
  }

  function handleOpenFullMenu() {
    setExpandedNavId(null);
    openMenu();
  }

  const sidebarProps = {
    items,
    logoAlt: t("logo.alt"),
    logoHref: isAdmin ? ROUTES.switchAccount : ROUTES.main,
    logoLinkLabel: isAdmin ? t("logo.adminLinkLabel") : t("logo.homeLinkLabel"),
    linkAs: ShellLink,
    primaryActionLabel: t("registerCampaign"),
    isPrimaryActionDisabled: true,
    // 비로그인의 이용 가이드는 헤더에만 둠(Figma 주석 5180:89119).
    guideLabel: session ? t("guide") : undefined,
    guideExtra: import.meta.env.DEV ? <DevLanguageSwitcher /> : undefined,
    // 광고주·인플루언서 전환(Figma Sidebar Footer Toggle / Tab). 인플루언서 화면이 아직 없어 광고주에 고정함.
    footerSwitch: session ? (
      <ToggleTab
        aria-label={t("role.label")}
        className="w-full *:flex-1"
        value="advertiser"
        onValueChange={() => {}}
        options={[
          { value: "advertiser", label: t("role.advertiser") },
          { value: "influencer", label: t("role.influencer"), disabled: true },
        ]}
      />
    ) : undefined,
    onClickGuide: () =>
      window.open(CLIENT_GUIDE_URL, "_blank", "noopener,noreferrer"),
  };
  const navigationContextValue = {
    showLoginRequired: () => setIsLoginAlertOpen(true),
    isAuthenticated: session !== null,
    canAccessSubscribe: session !== null && session.authority !== "SUB",
    permissions: session?.permissions ?? null,
  };

  return (
    <NavigationContext value={navigationContextValue}>
      <div
        {...keyboardRootProps}
        className={cn(
          // --keyboard-anchor-gap: 키보드가 열릴 때 [data-keyboard-anchor]를 키보드 위로 띄우는 여백. 본문이 scroll-margin-bottom이나 아래 패딩으로 씀.
          "flex h-dvh overflow-hidden bg-background [--keyboard-anchor-gap:--spacing(4)]",
          // 본문 아래 끝이 흐려질 때 비치는 셸 배경을 셸 아래 블록과 같게 해 이음매 없이 이어지게 함.
          isFittedToViewport && keyboardGapClassName,
          className,
        )}
      >
        <div className="hidden shrink-0 desktop:block">
          <SidebarNav
            {...sidebarProps}
            navLabel={t("menu.main")}
            isCollapsed={isCollapsed}
            toggleLabel={isCollapsed ? t("menu.expand") : t("menu.collapse")}
            onClickRailGroup={handleClickDesktopRailGroup}
            onClickToggle={handleToggleDesktopSidebar}
          />
        </div>
        <div className="hidden shrink-0 tablet:block desktop:hidden">
          <SidebarNav
            {...sidebarProps}
            navLabel={t("menu.collapsed")}
            isCollapsed
            toggleLabel={t("menu.openFull")}
            onClickRailGroup={handleClickTabletRailGroup}
            onClickToggle={handleOpenFullMenu}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            title={headerTitle}
            icon={icon ?? <currentNavItem.icon />}
            isTitleVisibleOnMobile={isTitleVisibleOnMobile}
            menuLabel={t("menu.open")}
            onClickMenu={handleOpenFullMenu}
          >
            <ShellHeaderActions
              session={session}
              onClickGuide={sidebarProps.onClickGuide}
            />
          </AppHeader>
          <main
            ref={mainRef}
            className={cn(
              "min-h-0 flex-1 overflow-auto",
              mainClassName ?? "p-5",
              isCustomerCenterPath && CUSTOMER_CENTER_MAIN_CLASS,
              isFittedToViewport && KEYBOARD_FITTED_MAIN_CLASS,
            )}
          >
            {children}
          </main>
        </div>
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetContent
            side="left"
            overlayClassName="bg-foreground/10"
            showCloseButton={false}
            className="w-57.5"
            aria-describedby={undefined}
            onCloseAutoFocus={handleCloseAutoFocus}
          >
            <SheetTitle className="sr-only">{t("menu.full")}</SheetTitle>
            <SidebarNav
              {...sidebarProps}
              navLabel={t("menu.full")}
              className="w-full"
              toggleLabel={t("menu.close")}
              onClickToggle={closeMenu}
            />
          </SheetContent>
        </Sheet>
      </div>
      <LoginRequiredAlert
        open={isLoginAlertOpen}
        onCancel={() => setIsLoginAlertOpen(false)}
        onLogin={() => {
          setIsLoginAlertOpen(false);
          closeMenu();
          void navigate(ROUTES.login);
        }}
      />
      {gapPaintStyle && (
        <div
          aria-hidden
          className={keyboardGapClassName}
          style={gapPaintStyle}
        />
      )}
    </NavigationContext>
  );
}
