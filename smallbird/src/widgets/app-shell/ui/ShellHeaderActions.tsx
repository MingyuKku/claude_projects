import { useNavigate } from "react-router";

import { useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  HeaderGuestActions,
  HeaderPointButton,
  UserMenu,
} from "@/shared/components/app-header";
import { ROUTES } from "@/shared/config";
import { formatNumber, useTranslation } from "@/shared/i18n";

import { useLogoutAction } from "../model/useLogoutAction";
import { AlertPopover } from "./AlertPopover";
import { GuideLanguageButtons } from "./GuideLanguageButtons";

import type { SessionViewModel } from "@/entities/session";

interface ShellHeaderActionsProps {
  session: SessionViewModel | null;
  onClickGuide: () => void;
}

// 헤더 오른쪽 묶음(비로그인은 이용 가이드·언어·로그인, 로그인은 포인트·알림·프로필). AppShell과 FocusShell이 함께 씀.
export function ShellHeaderActions({
  session,
  onClickGuide,
}: ShellHeaderActionsProps) {
  const { t } = useTranslation("widgets/app-shell");
  const navigate = useNavigate();
  const { handleClickLogout, isLoggingOut } = useLogoutAction();
  // 잔액은 로그인했을 때만 읽고, 불러오지 못하면 "—"로 둠.
  const { balance } = useBigbirdMoneyBalance(session !== null);

  if (!session) {
    return (
      <HeaderGuestActions
        loginLabel={t("header.login")}
        onClickLogin={() => {
          void navigate(ROUTES.login);
        }}
      >
        <GuideLanguageButtons placement="header" onClickGuide={onClickGuide} />
      </HeaderGuestActions>
    );
  }

  return (
    <>
      <HeaderPointButton
        amount={balance ? formatNumber(balance.amount) : "—"}
        label={t("header.points")}
        onClick={() => {
          void navigate(ROUTES.mypageMoney);
        }}
      />
      <AlertPopover canReceive={session.authority !== "SUB"} />
      <UserMenu
        name={session.displayName}
        email={session.email}
        avatarSrc={session.profileImageUrl ?? undefined}
        menuLabel={t("header.profile")}
        settingsLabel={t("header.settings")}
        logoutLabel={isLoggingOut ? t("header.loggingOut") : t("header.logout")}
        onClickSettings={() => {
          void navigate(ROUTES.mypageAccount);
        }}
        onClickLogout={() => void handleClickLogout()}
        isLogoutDisabled={isLoggingOut}
      />
    </>
  );
}
