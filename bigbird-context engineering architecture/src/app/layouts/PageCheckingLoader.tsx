import { LoaderCircle } from "lucide-react";

import { useTranslation } from "@/shared/i18n";

// 화면 권한 확인이 끝나기 전에 셸 안에 보여주는 로더.
export function PageCheckingLoader() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center">
      <LoaderCircle
        role="status"
        aria-label={t("status.checking")}
        className="size-6 animate-spin text-muted-foreground"
      />
    </div>
  );
}
