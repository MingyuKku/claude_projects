import { PageFallback, RootLayout } from "../layouts/RootLayout";
import { RouteErrorBoundary } from "../providers/ErrorBoundary";

import type { RouteObject } from "react-router";

// 라우트는 이 파일에서 "선언만" 한다. 화면은 pages/* 의 Public API 를 lazy 로 가져온다.
// - 페이지별로 번들이 분리되어 첫 로딩이 가벼워진다.
// - 서버 데이터는 loader 가 아니라 각 슬라이스의 SWR 훅이 가져온다 (.claude/rules/routing.md).
// 경로가 늘어나면 shared/config/routes.ts 의 ROUTES 에 먼저 추가하고 여기서 참조한다.
export const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: PageFallback,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("@/pages/home")).HomePage,
        }),
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("@/pages/not-found")).NotFoundPage,
        }),
      },
    ],
  },
];
