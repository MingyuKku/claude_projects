import { Navigate } from "react-router";

import { AuthGuard } from "@/entities/session";
import { SwitchAccountList } from "@/features/switch-account";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { hardNavigate } from "@/shared/lib";
import { AppShell } from "@/widgets/app-shell";

export function SwitchAccountPage() {
  const { t } = useTranslation("pages/switch-account");

  return (
    <AuthGuard>
      {(session) =>
        session.authority === "ADMIN" ? (
          <AppShell session={session} title={t("title")} icon={null}>
            <title>{t("title")}</title>
            <SwitchAccountList
              onSuccessSwitch={() => {
                // 계정별 캐시와 진행 중 요청이 이전 사용자 데이터를 복원하지 않도록 재로드한다.
                hardNavigate(ROUTES.main);
              }}
            />
          </AppShell>
        ) : (
          <Navigate to={ROUTES.main} replace />
        )
      }
    </AuthGuard>
  );
}
