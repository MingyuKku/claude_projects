import { Navigate, useOutletContext } from "react-router";

import { SwitchAccountList } from "@/features/switch-account";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { hardNavigate } from "@/shared/lib";
import { AppShell } from "@/widgets/app-shell";

import type { SessionViewModel } from "@/entities/session";

export function SwitchAccountPage() {
  const { t } = useTranslation("pages/switch-account");
  const session = useOutletContext<SessionViewModel>();

  if (session.authority !== "ADMIN") {
    return <Navigate to={ROUTES.main} replace />;
  }

  return (
    <AppShell session={session} title={t("title")} icon={null}>
      <title>{t("title")}</title>
      <SwitchAccountList
        onSuccessSwitch={() => {
          // 계정별 캐시와 진행 중 요청이 이전 사용자 데이터를 복원하지 않도록 재로드한다.
          hardNavigate(ROUTES.main);
        }}
      />
    </AppShell>
  );
}
