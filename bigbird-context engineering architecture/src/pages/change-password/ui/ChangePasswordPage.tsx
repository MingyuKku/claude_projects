import { useNavigate } from "react-router";

import { ChangePasswordForm } from "@/features/change-password";
import { AuthHeader } from "@/shared/components/auth";
import { HISTORY_BACK, ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

export function ChangePasswordPage() {
  const { t } = useTranslation("pages/change-password");
  const navigate = useNavigate();

  function handleClickBack() {
    void navigate(HISTORY_BACK);
  }

  function handleClickLogin() {
    void navigate(ROUTES.login);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <title>{t("title")}</title>
      <AuthHeader title={t("title")} onClickBack={handleClickBack} />
      <ChangePasswordForm
        className="items-center"
        onClickLogin={handleClickLogin}
      />
    </main>
  );
}
