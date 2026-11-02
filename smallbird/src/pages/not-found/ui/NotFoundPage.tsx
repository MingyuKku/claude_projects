import { Link } from "react-router";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

export function NotFoundPage() {
  const { t } = useTranslation("pages/not-found");

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <Link to={ROUTES.home} className="mt-4 inline-block text-sm underline">
        {t("homeLink")}
      </Link>
    </main>
  );
}
