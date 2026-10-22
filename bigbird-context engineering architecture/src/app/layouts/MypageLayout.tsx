import { UserCog } from "lucide-react";
import { Navigate, Outlet, useMatches } from "react-router";

import { AuthGuard } from "@/entities/session";
import { ROUTES } from "@/shared/config";
import { AppShell } from "@/widgets/app-shell";

import { PageCheckingLoader } from "./PageCheckingLoader";

// 마이페이지 세 화면(구독·빅버드 머니·계정 설정)이 공유하는 셸. 페이지끼리는 서로 임포트할 수 없어
// 그룹 묶음은 app 레이어가 맡음. 고객센터와 달리 화면 단위 권한 검사는 두지 않음(계정 설정은 모든 로그인 계정).
// 헤더 제목은 현재 LNB 하위 메뉴 이름을 따르고, 아이콘만 마이페이지 아이콘으로 고정함.
// 좌우 여백(MO 16·TAB 20)은 시안을 따르고, 하위 화면이 같은 값을 쓰도록 CSS 변수 --mypage-gutter로 내림(좌우로 화면
// 끝까지 채우는 탭 줄·하단 고정 버튼이 이 값만큼 바깥으로 나감). 위·아래 여백은 두지 않음. 이 <main>이 스크롤 컨테이너라서
// padding이 있으면 그 안의 sticky 요소(탭 줄, Sub ID 생성 버튼)가 padding만큼 떨어져 멈춤. 필요한 여백은 각 화면이 직접 둠.
const MAIN_CLASS_NAME =
  "px-(--mypage-gutter) [--mypage-gutter:calc(var(--spacing)*4)] tablet:[--mypage-gutter:calc(var(--spacing)*5)]";

// Sub ID는 구독에 들어갈 수 없음. 빅버드 머니를 Master와 공유하고 구독 상품은 Master가 결제·관리하며
// Sub ID는 그 이용 권한만 공유받음. 직접 주소로 들어오면 계정 설정으로 보냄(LNB 메뉴 비활성은 구독 화면 구현 때 함께 적용).
const MASTER_ONLY_PATHS: readonly string[] = [ROUTES.mypageSubscribe];

export function MypageLayout() {
  // 같은 라우트 안의 이동(탭 전환)은 같은 페이지로 봄.
  const lastMatch = useMatches().at(-1);
  const pageKey = lastMatch?.id;
  return (
    <AuthGuard pageKey={pageKey}>
      {(session, isCheckingPage) => (
        <AppShell
          session={session}
          icon={<UserCog />}
          isTitleVisibleOnMobile
          mainClassName={MAIN_CLASS_NAME}
        >
          {session.authority === "SUB" &&
          MASTER_ONLY_PATHS.includes(lastMatch?.pathname ?? "") ? (
            <Navigate to={ROUTES.mypageAccount} replace />
          ) : isCheckingPage ? (
            <PageCheckingLoader />
          ) : (
            <Outlet context={session} />
          )}
        </AppShell>
      )}
    </AuthGuard>
  );
}
