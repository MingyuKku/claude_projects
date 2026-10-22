import { Headset } from "lucide-react";
import { Navigate, Outlet, useMatches } from "react-router";

import { AuthGuard } from "@/entities/session";
import { ROUTES } from "@/shared/config";
import { AppShell } from "@/widgets/app-shell";

import { PageCheckingLoader } from "./PageCheckingLoader";

export function AuthenticatedLayout() {
  // 같은 라우트 안의 이동(문의 선택)은 같은 페이지로 봄.
  const pageKey = useMatches().at(-1)?.id;
  return (
    <AuthGuard pageKey={pageKey}>
      {(session, isCheckingPage) => {
        // 확인이 끝나기 전에는 권한으로 이동시키지 않고 셸 안에 로더만 둠.
        const canAccess =
          isCheckingPage || session.subPermissions.customerService;
        if (!canAccess) {
          return <Navigate to={ROUTES.main} replace />;
        }
        return (
          <AppShell session={session} icon={<Headset />} isTitleVisibleOnMobile>
            {isCheckingPage ? (
              <PageCheckingLoader />
            ) : (
              <Outlet context={session} />
            )}
          </AppShell>
        );
      }}
    </AuthGuard>
  );
}
