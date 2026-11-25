import { Users } from "lucide-react";
import { Outlet, useLoaderData, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";
import { AppShell } from "@/widgets/app-shell";

import type { sessionLoader } from "../router/session-middleware";

// 크리에이터 매칭 화면이 공유하는 셸. 헤더 제목은 현재 LNB 하위 메뉴 이름을 따르고 아이콘만 매칭 그룹 아이콘으로 고정함.
// 화면이 남은 높이를 채워 안쪽 목록만 스크롤하므로 아래·좌우 여백만 둠.
const MAIN_CLASS_NAME = "ds-px-5 ds-pb-5 ds-pt-0.5 desktop:pt-0";

// 로그인 확인과 권한(`GET /v3/sec`)은 라우트의 세션 middleware가 화면을 그리기 전에 끝냄(app/router/session-middleware.ts).
export function CreatorMatchingLayout() {
  const session = useLoaderData<typeof sessionLoader>();
  const { pathname } = useLocation();

  return (
    <AppShell
      session={session}
      icon={<Users />}
      isTitleVisibleOnMobile
      // 검색은 AI 추천 도우미와 목록이 나란히 있어 LNB가 본문 위를 덮음.
      isSidebarOverlay={pathname === ROUTES.creatorSearch}
      mainClassName={MAIN_CLASS_NAME}
    >
      <Outlet context={session} />
    </AppShell>
  );
}
