import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

import { useTranslation } from "@/shared/i18n";

// 라우트 단위 전역 에러 화면. 사용자에게는 다음 행동(재시도)을 보여주고, 원인은 콘솔에 남긴다.
// 독립적으로 실패할 수 있는 위젯에는 지역 바운더리를 따로 둔다 (.claude/rules/error-handling.md).
export function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();

  // 렌더는 순수해야 하므로(StrictMode에서 두 번 실행됨) 로그는 커밋 뒤에 남긴다.
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : t("error.unexpected");

  return (
    <main role="alert" className="p-8">
      <h1 className="text-xl font-semibold">{t("error.title")}</h1>
      <p className="mt-2 text-sm text-neutral-600">{message}</p>
      <button
        type="button"
        className="mt-4 rounded-md border px-3 py-1.5 text-sm"
        onClick={() => window.location.reload()}
      >
        {t("action.retry")}
      </button>
    </main>
  );
}
