import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { routes } from "./routes";

export async function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  // CI의 첫 모듈 로딩 시간을 요소 조회 제한 시간에 포함하지 않는다.
  // 실제 라우트의 lazy를 실행하고 초기화가 끝난 뒤 화면 동작을 검증한다.
  if (!router.state.initialized) {
    await new Promise<void>((resolve) => {
      const unsubscribe = router.subscribe((state) => {
        if (state.initialized) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return router;
}
