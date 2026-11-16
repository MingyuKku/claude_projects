import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

// 모집형 등록은 모집형 갱신 작업 전이라 준비 중으로 둠(사용자 결정 2026-11-16).
export function RegisterComingSoon() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState type="construction" title={t("status.comingSoon")} />
    </div>
  );
}
