import { Outlet, useLoaderData } from "react-router";

import type { optionalSessionLoader } from "../router/session-middleware";

// 로그인이 선택인 화면(홈, 준비 중)에 세션 확인 결과를 기다리지 않고 Promise로 넘김. 화면은 바로 그리고 셸만 결과에 따라 바뀜.
export function OptionalSessionLayout() {
  const { session } = useLoaderData<typeof optionalSessionLoader>();

  return <Outlet context={session} />;
}
