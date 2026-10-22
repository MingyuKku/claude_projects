import { useLocation, useNavigate } from "react-router";

import {
  AppHeader,
  HeaderGuestActions,
  HeaderPointButton,
  UserMenu,
} from "@/shared/components/app-header";
import { SidebarNav } from "@/shared/components/sidebar-nav";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { CLIENT_GUIDE_URL } from "../model/navigation";
import { NavigationContext } from "../model/navigation-context";
import { useSidebarStore } from "../model/sidebar-store";
import { useKeyboardAwareShell } from "../model/useKeyboardAwareShell";
import { useLogoutAction } from "../model/useLogoutAction";
import { useMobileMenu } from "../model/useMobileMenu";
import { useShellNavItems } from "../model/useShellNavItems";
import { AlertPopover } from "./AlertPopover";
import { DevLanguageSwitcher } from "./DevLanguageSwitcher";
import { ShellLink } from "./ShellLink";

import type { ShellNavId } from "../model/navigation";
import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

const CUSTOMER_CENTER_PATH_PREFIXES: string[] = [
  ROUTES.customerCenterBigbird,
  ROUTES.customerCenterBuyer,
];
// 고객센터는 모바일에서 본문이 가장자리까지 차고, 태블릿 이상에서는 위쪽 여백 없이 좌우·아래만 둠.
const CUSTOMER_CENTER_MAIN_CLASS =
  "p-0 tablet:px-5 tablet:py-0 tablet:pb-5 desktop:px-5 desktop:pb-5";

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
   * 키보드가 열릴 때 보이게 할 영역에 `data-keyboard-anchor`와 scroll-margin-bottom을 둠. 키보드가 열릴 때 페이지를 줄이는 것은 브라우저 몫(Android는 index.html의
   * `interactive-widget=resizes-content`, iOS Safari는 미지원이라 OS 기본 동작). 규칙은 `.claude/skills/mobile-keyboard/SKILL.md`.
   */
  isKeyboardAware?: boolean;
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
}: AppShellProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const keyboardRootProps = useKeyboardAwareShell(isKeyboardAware);
  const { handleClickLogout, isLoggingOut } = useLogoutAction();
  const { items, activeNavItem, currentNavItem, currentSubItem } =
    useShellNavItems(activeNavId);
  const {
    isMenuOpen,
    setIsMenuOpen,
    openMenu,
    closeMenu,
    handleCloseAutoFocus,
  } = useMobileMenu();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

  const isAdmin = session?.authority === "ADMIN";
  const isCustomerCenterPath = CUSTOMER_CENTER_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const activeNavTitle = activeNavItem
    ? t(`nav.${activeNavItem.id}`)
    : (currentSubItem?.label ?? t("nav.home"));
  const headerTitle = title ?? activeNavTitle;
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
    onClickGuide: () =>
      window.open(CLIENT_GUIDE_URL, "_blank", "noopener,noreferrer"),
  };
  const navigationContextValue = {
    closeMenu,
    isAuthenticated: session !== null,
    canAccessCustomerCenter: session?.subPermissions.customerService ?? false,
  };

  return (
    <NavigationContext value={navigationContextValue}>
      <div
        {...keyboardRootProps}
        className={cn("flex h-dvh overflow-hidden bg-background", className)}
      >
        <div className="hidden shrink-0 desktop:block">
          <SidebarNav
            {...sidebarProps}
            navLabel={t("menu.main")}
            isCollapsed={isCollapsed}
            toggleLabel={isCollapsed ? t("menu.expand") : t("menu.collapse")}
            onClickToggle={toggleCollapsed}
          />
        </div>
        <div className="hidden shrink-0 tablet:block desktop:hidden">
          <SidebarNav
            {...sidebarProps}
            navLabel={t("menu.collapsed")}
            isCollapsed
            toggleLabel={t("menu.openFull")}
            onClickToggle={openMenu}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            title={headerTitle}
            icon={icon ?? <currentNavItem.icon />}
            isTitleVisibleOnMobile={isTitleVisibleOnMobile}
            menuLabel={t("menu.open")}
            onClickMenu={openMenu}
          >
            {session ? (
              <>
                <HeaderPointButton
                  amount="—"
                  label={t("header.points")}
                  disabled
                  title={t("comingSoon")}
                />
                <AlertPopover />
                <UserMenu
                  name={session.displayName}
                  email={session.email}
                  menuLabel={t("header.profile")}
                  settingsLabel={t("header.settings")}
                  logoutLabel={
                    isLoggingOut ? t("header.loggingOut") : t("header.logout")
                  }
                  onClickSettings={() => {
                    void navigate(ROUTES.mypageAccount);
                  }}
                  onClickLogout={() => void handleClickLogout()}
                  isLogoutDisabled={isLoggingOut}
                />
              </>
            ) : (
              <HeaderGuestActions
                guideLabel={t("guide")}
                loginLabel={t("header.login")}
                onClickGuide={sidebarProps.onClickGuide}
                onClickLogin={() => {
                  void navigate(ROUTES.login);
                }}
              />
            )}
          </AppHeader>
          <main
            className={cn(
              "min-h-0 flex-1 overflow-auto",
              mainClassName ?? "p-5",
              isCustomerCenterPath && CUSTOMER_CENTER_MAIN_CLASS,
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
    </NavigationContext>
  );
}
