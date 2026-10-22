import { replace } from "react-router";

import { ROUTES } from "@/shared/config";

import { AuthenticatedLayout } from "../layouts/AuthenticatedLayout";
import { MypageLayout } from "../layouts/MypageLayout";
import { PageFallback } from "../layouts/PageFallback";
import { RootLayout } from "../layouts/RootLayout";
import { RouteErrorBoundary } from "../providers/ErrorBoundary";

import type { ComponentType } from "react";
import type { RouteObject } from "react-router";

// Routes are declared here only. Each screen is a lazy import of a page's Public API,
// so every page gets its own bundle.
// Server data is fetched by each slice's SWR hook, not by route loaders (.claude/rules/routing.md).
// Paths come from ROUTES in shared/config/routes.ts; add new ones there first.
function page(path: string, load: () => Promise<ComponentType>): RouteObject {
  return {
    path,
    lazy: async () => ({ Component: await load() }),
  };
}

export const routes: RouteObject[] = [
  {
    path: ROUTES.home,
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
      page(
        ROUTES.influencerSearch,
        async () => (await import("@/pages/coming-soon")).ComingSoonPage,
      ),
      page(ROUTES.introduction, async () => {
        return (await import("@/pages/introduction")).IntroductionPage;
      }),

      // Login. `/logout` has no screen yet and shows the login page, as the old app did.
      page(ROUTES.login, async () => (await import("@/pages/login")).LoginPage),
      page(
        ROUTES.logout,
        async () => (await import("@/pages/login")).LoginPage,
      ),
      {
        path: ROUTES.legacyMain,
        loader: ({ request }) =>
          replace(`${ROUTES.main}${new URL(request.url).search}`),
      },

      page(
        ROUTES.switchAccount,
        async () => (await import("@/pages/switch-account")).SwitchAccountPage,
      ),

      {
        Component: AuthenticatedLayout,
        children: [
          page(
            ROUTES.customerCenterBigbirdThread,
            async () =>
              (await import("@/pages/customer-center-bigbird"))
                .CustomerCenterBigbirdPage,
          ),
          page(
            ROUTES.customerCenterBigbirdNew,
            async () =>
              (await import("@/pages/customer-center-bigbird-new"))
                .CustomerCenterBigbirdNewPage,
          ),
          page(
            ROUTES.customerCenterBuyerThread,
            async () =>
              (await import("@/pages/customer-center-buyer"))
                .CustomerCenterBuyerPage,
          ),
        ],
      },

      // 마이페이지. 셸과 로그인 확인은 MypageLayout이 맡음(권한 검사 없음).
      {
        Component: MypageLayout,
        children: [
          page(
            ROUTES.mypageSubscribe,
            async () =>
              (await import("@/pages/mypage-subscribe")).MyPageSubscribePage,
          ),
          page(
            ROUTES.mypageMoney,
            async () => (await import("@/pages/mypage-money")).MyPageMoneyPage,
          ),
          page(
            ROUTES.mypageAccount,
            async () =>
              (await import("@/pages/mypage-account")).MyPageAccountPage,
          ),
        ],
      },

      // Account recovery and password change.
      page(ROUTES.find, async () => (await import("@/pages/find")).FindPage),
      page(
        ROUTES.findEmailSent,
        async () => (await import("@/pages/find-email-sent")).FindEmailSentPage,
      ),
      page(
        ROUTES.changePassword,
        async () =>
          (await import("@/pages/change-password")).ChangePasswordPage,
      ),
      page(
        ROUTES.expired,
        async () => (await import("@/pages/expired")).ExpiredPage,
      ),

      // Sign-up.
      page(ROUTES.join, async () => (await import("@/pages/join")).JoinPage),
      page(
        ROUTES.welcome,
        async () => (await import("@/pages/welcome")).WelcomePage,
      ),
      page(ROUTES.cert, async () => (await import("@/pages/cert")).CertPage),
      page(
        ROUTES.certSuccess,
        async () => (await import("@/pages/cert-success")).CertSuccessPage,
      ),

      page(
        ROUTES.snsLink,
        async () => (await import("@/pages/sns-link")).SnsLinkPage,
      ),
      page(ROUTES.terms, async () => (await import("@/pages/terms")).TermsPage),

      // OAuth callbacks. These paths are registered in each provider console.
      page(
        ROUTES.authKakao,
        async () => (await import("@/pages/social-callback")).KakaoCallbackPage,
      ),
      page(
        ROUTES.authNaver,
        async () => (await import("@/pages/social-callback")).NaverCallbackPage,
      ),
      page(
        ROUTES.authGoogle,
        async () =>
          (await import("@/pages/social-callback")).GoogleCallbackPage,
      ),
      page(
        ROUTES.authApple,
        async () => (await import("@/pages/social-callback")).AppleCallbackPage,
      ),

      // 개발 서버에서만 등록하는 공통 컴포넌트 미리보기. 프로덕션 번들에는 포함되지 않음.
      ...(import.meta.env.DEV
        ? [
            page(
              ROUTES.uiPreview,
              async () => (await import("@/pages/ui-preview")).UiPreviewPage,
            ),
          ]
        : []),

      {
        path: "*",
        lazy: async () => ({
          Component: (await import("@/pages/not-found")).NotFoundPage,
        }),
      },
    ],
  },
];
