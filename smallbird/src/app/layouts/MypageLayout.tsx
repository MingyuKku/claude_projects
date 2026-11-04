import { UserCog } from "lucide-react";
import { Outlet, useLoaderData } from "react-router";

import { AppShell } from "@/widgets/app-shell";

import type { sessionLoader } from "../router/session-middleware";

// 마이페이지 세 화면(구독·빅버드 머니·계정 설정)이 공유하는 셸. 페이지끼리는 서로 임포트할 수 없어
// 그룹 묶음은 app 레이어가 맡음. 고객센터와 달리 화면 단위 권한 검사는 두지 않음(계정 설정은 모든 로그인 계정).
// 헤더 제목은 현재 LNB 하위 메뉴 이름을 따르고, 아이콘만 마이페이지 아이콘으로 고정함.
// 좌우 여백(MO 16·TAB 20)은 시안을 따르고, 하위 화면이 같은 값을 쓰도록 CSS 변수 --mypage-gutter로 내림(좌우로 화면
// 끝까지 채우는 탭 줄·하단 고정 버튼이 이 값만큼 바깥으로 나감). 위·아래 여백은 두지 않음. 이 <main>이 스크롤 컨테이너라서
// padding이 있으면 그 안의 sticky 요소(탭 줄, Sub ID 생성 버튼)가 padding만큼 떨어져 멈춤. 필요한 여백은 각 화면이 직접 둠.
// 스크롤바 자리를 미리 비우지 않음(scrollbar-gutter 미사용). 비워 두면 스크롤바가 보이는 환경(Windows, macOS "항상 보기")에서 내용이 짧은 탭도
// 오른쪽 여백이 스크롤바 폭(약 15px)만큼 더 커져 시안의 좌우 여백(MO 16·TAB 20·PC 20)과 달라짐. 대신 긴 탭만 스크롤바 폭만큼 본문이 좁아짐.
const MAIN_CLASS_NAME =
  "px-(--mypage-gutter) [--mypage-gutter:calc(var(--spacing)*4)] tablet:[--mypage-gutter:calc(var(--spacing)*5)]";

// 로그인 확인과 Sub ID의 구독 진입 차단은 라우트의 세션 middleware가 화면을 그리기 전에 끝냄(app/router/session-middleware.ts).
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
