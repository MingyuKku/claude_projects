import { useTranslation } from "@/shared/i18n";

// 첫 진입 시 lazy 라우트가 로드되는 동안 보여준다.
export function PageFallback() {
  const { t } = useTranslation();

  return (
    <div role="status" className="p-8 text-sm text-neutral-500">
      {t("status.loading")}
    </div>
  );
}
