import { useTranslation } from "@/shared/i18n";
import { Spinner } from "@/shared/ui/spinner";

// 이미 보이는 목록 아래에 이어 읽는 중임을 알림. 구조를 미리 보여 줄 필요가 없어 스켈레톤 대신 스피너를 씀.
export function LoadMoreSpinner() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center py-4">
      <Spinner
        aria-label={t("status.loading")}
        className="size-4 text-foreground"
        strokeWidth={1.5}
      />
    </div>
  );
}
