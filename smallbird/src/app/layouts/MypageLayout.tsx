import { UserCog } from "lucide-react";
import { Outlet, useLoaderData } from "react-router";

import { AppShell } from "@/widgets/app-shell";

import type { sessionLoader } from "../router/session-middleware";

// 마이페이지 세 화면(구독·빅버드 머니·계정 설정)이 공유하는 셸. 페이지끼리는 서로 임포트할 수 없어
// 그룹 묶음은 app 레이어가 맡음. 고객센터와 달리 화면 단위 권한 검사는 두지 않음(계정 설정은 모든 로그인 계정).
// 헤더 제목은 현재 LNB 하위 메뉴 이름을 따르고, 아이콘만 마이페이지 아이콘으로 고정함.
// 좌우 여백은 CSS 변수 --mypage-gutter로 내려, 화면 끝까지 채우는 탭 줄·하단 고정 버튼이 이 값만큼 바깥으로 나감.
// 위·아래 여백은 두지 않음: 이 <main>이 스크롤 컨테이너라 padding이 있으면 그 안의 sticky 요소가 padding만큼 떨어져 멈춤.
// scrollbar-gutter를 쓰지 않음: 스크롤바가 보이는 환경(Windows, macOS "항상 보기")에서 짧은 탭도 오른쪽 여백이 시안보다 커짐.
const MAIN_CLASS_NAME =
  "px-(--mypage-gutter) [--mypage-gutter:--spacing(4)] tablet:[--mypage-gutter:--spacing(5)]";

// 로그인 확인과 Sub ID의 구독 진입 차단은 라우트의 세션 middleware가 화면을 그리기 전에 끝냄(app/router/session-middleware.ts).
// 구독만 비로그인도 들어오며 이때 session은 null이라 셸은 비로그인 헤더·LNB로 그림.
export function MypageLayout() {
  const session = useLoaderData<typeof sessionLoader>();

  return (
    <AppShell
      session={session}
      icon={<UserCog />}
      isTitleVisibleOnMobile
      mainClassName={MAIN_CLASS_NAME}
    >
      <Outlet context={session} />
    </AppShell>
  );
}
