import { use } from "react";
import { Link } from "react-router";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { NavigationContext } from "../model/navigation-context";

import type { ComponentProps } from "react";

// 구독·빅버드 머니는 각 화면이 구현되기 전까지 허용 목록 밖(비활성).
const ENABLED_HREFS = new Set<string>([
  ROUTES.main,
  ROUTES.switchAccount,
  ROUTES.influencerSearch,
  ROUTES.mypageAccount,
]);
const CUSTOMER_CENTER_HREFS = new Set<string>([
  ROUTES.customerCenterBigbird,
  ROUTES.customerCenterBuyer,
]);

interface ShellLinkProps extends ComponentProps<"a"> {
  href: string;
}

export function ShellLink({
  href,
  className,
  onClick,
  ...props
}: ShellLinkProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { closeMenu, canAccessCustomerCenter, isAuthenticated } =
    use(NavigationContext);

  const isCustomerCenter = CUSTOMER_CENTER_HREFS.has(href);
  const isMypageAccount = href === ROUTES.mypageAccount;
  const isCustomerCenterAvailable =
    isCustomerCenter && (!isAuthenticated || canAccessCustomerCenter);
  const isEnabledLink = ENABLED_HREFS.has(href) || isCustomerCenterAvailable;
  const isLoginRequired =
    (isCustomerCenter || isMypageAccount) && !isAuthenticated;

  function handleClickLink(event: Parameters<NonNullable<typeof onClick>>[0]) {
    onClick?.(event);
    if (!event.defaultPrevented) closeMenu();
  }

  if (!isEnabledLink) {
    return (
      <span
        {...props}
        role="link"
        aria-disabled="true"
        title={isCustomerCenter ? undefined : t("comingSoon")}
        className={cn(className, "cursor-not-allowed")}
      />
    );
  }

  return (
    <Link
      {...props}
      className={className}
      to={isLoginRequired ? ROUTES.login : href}
      onClick={handleClickLink}
    />
  );
}
