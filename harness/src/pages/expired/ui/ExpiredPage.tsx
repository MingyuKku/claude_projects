import { ExpiredPasswordForm } from "@/features/expired-password";
import { useTranslation } from "@/shared/i18n";

export function ExpiredPage() {
  const { t } = useTranslation("pages/expired");

  return (
    <>
      <title>{t("title")}</title>
      <ExpiredPasswordForm />
    </>
  );
}
