import { Headset } from "lucide-react";
import { Outlet, useMatches } from "react-router";

import { AuthGuard } from "@/entities/session";
import { AppShell } from "@/widgets/app-shell";

import { PageCheckingLoader } from "./PageCheckingLoader";

export function AuthenticatedLayout() {
  // 같은 라우트 안의 이동(문의 선택)은 같은 페이지로 봄.
  const pageKey = useMatches().at(-1)?.id;
  return (
    <AuthGuard pageKey={pageKey}>
      {(session, isCheckingPage) => (
        // 고객센터 진입 권한은 서버가 경로별로 판단함(`GET /v3/sec`: 빅버드 문의는 모두, 구매자 문의는 권한이 있는 Sub ID만).
        <AppShell session={session} icon={<Headset />} isTitleVisibleOnMobile>
          {isCheckingPage ? (
            <PageCheckingLoader />
          ) : (
            <Outlet context={session} />
          )}
        </AppShell>
      )}
    </AuthGuard>
  );
}
