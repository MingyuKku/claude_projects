import { Loader2Icon } from "lucide-react";

import { useTranslation } from "@/shared/i18n";

// 새로고침·첫 진입에서 로그인이 필요한 화면의 세션 확인이 끝나기 전에 보여주는 전체 화면 로더.
export function SessionCheckingFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex h-dvh items-center justify-center">
      <Loader2Icon
        role="status"
        aria-label={t("status.loading")}
        className="size-6 animate-spin"
      />
      <span className="sr-only">{t("status.checking")}</span>
    </div>
  );
}
