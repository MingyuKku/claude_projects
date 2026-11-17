import { Headset } from "lucide-react";
import { Outlet, useLoaderData, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";
import { AppShell } from "@/widgets/app-shell";

import type { sessionLoader } from "../router/session-middleware";

// 키보드가 떠 있는 동안 본문 아래 끝이 비치는 배경. 모바일은 입력창 배경(대화 영역 bg-muted)이 본문 끝까지 차고, 태블릿 이상은 대화 영역 밖 여백(bg-background)이 끝에 닿음.
const BIGBIRD_KEYBOARD_GAP_CLASS_NAME = "bg-muted tablet:bg-background";

// 고객센터 진입 권한은 서버가 경로별로 판단함(`GET /v3/sec`: 빅버드 문의는 모두, 구매자 문의는 권한이 있는 Sub ID만).
// 확인은 라우트의 세션 middleware가 화면을 그리기 전에 끝냄(app/router/session-middleware.ts).
export function AuthenticatedLayout() {
  const session = useLoaderData<typeof sessionLoader>();
  const { pathname } = useLocation();
  // 빅버드 문의 입력창이 가상 키보드에 가리지 않게 키보드 대응을 켬(iOS Safari는 키보드가 레이아웃을 줄이지 않음).
  const isBigbirdInquiry = pathname.startsWith(ROUTES.customerCenterBigbird);

  return (
    <AppShell
      session={session}
      icon={<Headset />}
      isTitleVisibleOnMobile
      isKeyboardAware={isBigbirdInquiry}
      keyboardGapClassName={
        isBigbirdInquiry ? BIGBIRD_KEYBOARD_GAP_CLASS_NAME : undefined
      }
    >
      <Outlet context={session} />
    </AppShell>
  );
}
