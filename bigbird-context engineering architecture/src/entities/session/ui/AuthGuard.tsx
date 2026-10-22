import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import { getLastAllowedSession, useSession } from "../api/session-api";

import type { SessionViewModel } from "../model/schema";
import type { ReactNode } from "react";

interface AuthGuardProps {
  /**
   * `isCheckingPage`는 다른 페이지로 옮겨 그 경로의 권한을 확인하는 중일 때 true.
   * 셸은 직전 결과로 유지하고, 본문(Outlet)은 확인이 끝난 뒤 그림.
   */
  children: (session: SessionViewModel, isCheckingPage: boolean) => ReactNode;
  /**
   * 같은 페이지인지 가르는 값(예: 매칭된 라우트 id). 같은 페이지 안의 이동
   * (`/customer-center/bigbird` → `/customer-center/bigbird/1154`)은 권한이 같아
   * 직전 결과로 본문까지 계속 그림. 없으면 경로마다 다른 페이지로 봄.
   */
  pageKey?: string;
}

/** 경로별 세션 확인은 한 번만 수행하고, 확인된 세션을 하위 화면에 전달함. */
export function AuthGuard({ children, pageKey }: AuthGuardProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { session: checkedSession, isLoading, isError } = useSession(pathname);
  // 이 경로를 처음 확인하는 중이면 앞 화면에서 확인된 세션으로 셸만 먼저 그림.
  // pageKey를 넘겨 isCheckingPage 동안 판단을 미루는 호출부에만 적용함.
  const session =
    checkedSession ??
    (isLoading && pageKey !== undefined ? getLastAllowedSession() : undefined);
  const currentPage = pageKey ?? pathname;
  // 지금 들고 있는 세션 결과가 어느 페이지에서 확인된 것인지 기억함. 처음엔 없음.
  const [confirmedPage, setConfirmedPage] = useState<string>();
  if (!isLoading && checkedSession && confirmedPage !== currentPage) {
    setConfirmedPage(currentPage);
  }

  const isDenied = isError || !session?.isAllowed;

  // 앞 화면의 세션도 없을 때(새로고침·첫 진입)만 전체 로더를 띄움.
  if (isLoading && !session) {
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

  // 로컬 개발과 React 로그인 흐름을 유지하도록 외부 redirectTo 대신 앱 로그인으로 이동함.
  if (isDenied) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return children(session, isLoading && confirmedPage !== currentPage);
}
