import { use } from "react";
import { Link } from "react-router";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { NavigationContext } from "../model/navigation-context";

import type { MenuPermissions } from "@/entities/session";
import type { ComponentProps } from "react";

// 구독은 역할, 인플루언서 검색·빅버드 머니·구매자 문의는 세션의 메뉴 권한(`GET /v3/sec`)에 따라 아래에서 따로 판단함.
const ENABLED_HREFS = new Set<string>([
  ROUTES.main,
  ROUTES.switchAccount,
  ROUTES.mypageAccount,
  ROUTES.customerCenterBigbird,
]);
// 이 메뉴는 Sub ID가 해당 권한을 받아야 활성. 비로그인은 로그인 안내가 따로 있어 활성으로 둠.
const PERMISSION_BY_HREF: Record<string, keyof MenuPermissions> = {
  [ROUTES.influencerSearch]: "influencerMatching",
  [ROUTES.mypageMoney]: "bigbirdMoney",
  [ROUTES.customerCenterBuyer]: "purchaserQuestion",
};
const LOGIN_REQUIRED_HREFS = new Set<string>([
  ROUTES.customerCenterBigbird,
  ROUTES.customerCenterBuyer,
  ROUTES.mypageAccount,
  ROUTES.mypageSubscribe,
  ROUTES.mypageMoney,
]);

// 화면이 아직 없는 메뉴. 비로그인이 누르면 로그인 안내 알럿을 띄우고, 로그인한 사용자에게는 "준비 중"으로 비활성임.
const LOGIN_ALERT_NAV_IDS = new Set<string>(["influencerManage", "chat"]);

interface ShellLinkProps extends ComponentProps<"a"> {
  href: string;
  navId?: string;
}

export function ShellLink({
  href,
  navId,
  children,
  className,
  onClick,
  ...props
}: ShellLinkProps) {
  const { t } = useTranslation("widgets/app-shell");
  const {
    closeMenu,
    showLoginRequired,
    canAccessSubscribe,
    permissions,
    isAuthenticated,
  } = use(NavigationContext);

  const permissionKey = PERMISSION_BY_HREF[href];
  const isSubscribe = href === ROUTES.mypageSubscribe;
  const isPermissionAvailable =
    permissionKey !== undefined &&
    (!isAuthenticated || (permissions?.[permissionKey] ?? false));
  const isSubscribeAvailable =
    isSubscribe && (!isAuthenticated || canAccessSubscribe);
  const isEnabledLink =
    ENABLED_HREFS.has(href) || isPermissionAvailable || isSubscribeAvailable;
  const isLoginRequired = LOGIN_REQUIRED_HREFS.has(href) && !isAuthenticated;
  // 권한·역할로 막힌 메뉴는 "준비 중" 툴팁을 달지 않음.
  const isGatedLink = permissionKey !== undefined || isSubscribe;

  function handleClickLink(event: Parameters<NonNullable<typeof onClick>>[0]) {
    onClick?.(event);
    if (!event.defaultPrevented) closeMenu();
  }

  const isLoginAlertLink =
    !isAuthenticated && navId !== undefined && LOGIN_ALERT_NAV_IDS.has(navId);

  function handleClickLoginAlertLink(
    event: Parameters<NonNullable<typeof onClick>>[0],
  ) {
    event.preventDefault();
    onClick?.(event);
    showLoginRequired();
  }

  if (isLoginAlertLink) {
    return (
      <a
        {...props}
        href={href}
        className={className}
        onClick={handleClickLoginAlertLink}
      >
        {children}
      </a>
    );
  }

  if (!isEnabledLink) {
    return (
      <span
        {...props}
        role="link"
        aria-disabled="true"
        title={isGatedLink ? undefined : t("comingSoon")}
        className={cn(className, "cursor-not-allowed")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      {...props}
      className={className}
      to={isLoginRequired ? ROUTES.login : href}
      onClick={handleClickLink}
    >
      {children}
    </Link>
  );
}
