import { Outlet, useLoaderData } from "react-router";

import type { sessionLoader } from "../router/session-middleware";

// 셸을 스스로 그리는 로그인 필요 화면(계정 전환)에 확인된 세션만 넘김.
export function SessionLayout() {
  const session = useLoaderData<typeof sessionLoader>();

  return <Outlet context={session} />;
}
