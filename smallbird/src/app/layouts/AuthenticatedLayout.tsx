import { Headset } from "lucide-react";
import { Outlet, useLoaderData } from "react-router";

import { AppShell } from "@/widgets/app-shell";

import type { sessionLoader } from "../router/session-middleware";

// 고객센터 진입 권한은 서버가 경로별로 판단함(`GET /v3/sec`: 빅버드 문의는 모두, 구매자 문의는 권한이 있는 Sub ID만).
// 확인은 라우트의 세션 middleware가 화면을 그리기 전에 끝냄(app/router/session-middleware.ts).
export function AuthenticatedLayout() {
  const session = useLoaderData<typeof sessionLoader>();

  return (
    <AppShell session={session} icon={<Headset />} isTitleVisibleOnMobile>
      <Outlet context={session} />
    </AppShell>
  );
}
