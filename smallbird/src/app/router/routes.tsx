import { replace } from "react-router";

import { ROUTES } from "@/shared/config";

import { AuthenticatedLayout } from "../layouts/AuthenticatedLayout";
import { MypageLayout } from "../layouts/MypageLayout";
import { OptionalSessionLayout } from "../layouts/OptionalSessionLayout";
import { PageFallback } from "../layouts/PageFallback";
import { RootLayout } from "../layouts/RootLayout";
import { SessionCheckingFallback } from "../layouts/SessionCheckingFallback";
import { SessionLayout } from "../layouts/SessionLayout";
import { RouteErrorBoundary } from "../providers/ErrorBoundary";
import {
  forgetOtherPageSession,
  optionalSessionLoader,
  requireSession,
  revalidateOnEveryNavigation,
  sessionLoader,
} from "./session-middleware";

import type { ComponentType } from "react";
import type { RouteObject } from "react-router";

// Routes are declared here only. Each screen is a lazy import of a page's Public API,
// so every page gets its own bundle.
// Server data is fetched by each slice's SWR hook, not by route loaders. Loaders only pass the session
// that decides whether a screen can open (.claude/rules/routing.md).
// Paths come from ROUTES in shared/config/routes.ts; add new ones there first.
function page(path: string, load: () => Promise<ComponentType>): RouteObject {
  return {
    path,
    lazy: async () => ({ Component: await load() }),
  };
}

// 로그인이 필요한 화면을 묶는 레이아웃 라우트. 이동할 때마다 화면을 그리기 전에 세션을 확인하고(middleware),
// 확인된 세션을 loader로 레이아웃에 넘김. 가드 규칙은 .claude/rules/routing.md.
function requireSessionRoute(
  Component: ComponentType,
  children: RouteObject[],
): RouteObject {
  return {
    Component,
    middleware: [requireSession],
    loader: sessionLoader,
    shouldRevalidate: revalidateOnEveryNavigation,
    HydrateFallback: SessionCheckingFallback,
    children,
  };
}

const CAMPAIGN_COMING_SOON_PATHS = [
  ROUTES.campaignRegister,
  ROUTES.campaignRegisterDraft,
  ROUTES.campaignDetail,
];

function comingSoonPage(path: string) {
  return page(
    path,
    async () => (await import("@/pages/coming-soon")).ComingSoonPage,
  );
}

export const routes: RouteObject[] = [
  {
    path: ROUTES.home,
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: PageFallback,
    middleware: [forgetOtherPageSession],
    children: [
      // 로그인이 선택인 화면. 세션 확인을 기다리지 않고 화면을 먼저 그림.
      {
        Component: OptionalSessionLayout,
        loader: optionalSessionLoader,
        shouldRevalidate: revalidateOnEveryNavigation,
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
          // 캠페인 등록 API가 나오기 전이라 stage·prod 빌드에서는 준비 중 화면임. 개발 서버에서는 목으로 동작하는 화면을 아래에서 엶.
          ...(import.meta.env.DEV
            ? []
            : CAMPAIGN_COMING_SOON_PATHS.map(comingSoonPage)),
        ],
      },
      page(ROUTES.introduction, async () => {
        return (await import("@/pages/introduction")).IntroductionPage;
      }),

      page(ROUTES.login, async () => (await import("@/pages/login")).LoginPage),

      // 이니시스 결제창의 closeUrl. 결제창(레이어) 안에서 열려 결제창을 닫기만 하므로 로그인 확인과 셸이 없음.
      page(
        ROUTES.inicisClose,
        async () => (await import("@/pages/inicis-close")).InicisClosePage,
      ),
      {
        path: ROUTES.legacyMain,
        loader: ({ request }) =>
          replace(`${ROUTES.main}${new URL(request.url).search}`),
      },

      requireSessionRoute(SessionLayout, [
        page(
          ROUTES.switchAccount,
          async () =>
            (await import("@/pages/switch-account")).SwitchAccountPage,
        ),
        // 캠페인 등록: 새로 만들기와 작성이 한 화면이고 셸은 화면이 그림. Sub ID는 세션 middleware가 막음.
        // 등록 내역(`/campaign/:campaignId`)도 같은 셸을 쓰고, 조회는 할당된 Sub ID도 가능함(서버가 403으로 막음).
        ...(import.meta.env.DEV
          ? [
              ...[ROUTES.campaignRegister, ROUTES.campaignRegisterDraft].map(
                (path) =>
                  page(
                    path,
                    async () =>
                      (await import("@/pages/campaign-register"))
                        .CampaignRegisterPage,
                  ),
              ),
              page(
                ROUTES.campaignDetail,
                async () =>
                  (await import("@/pages/campaign-detail")).CampaignDetailPage,
              ),
            ]
          : []),
      ]),

      requireSessionRoute(AuthenticatedLayout, [
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
        page(
          ROUTES.customerCenterInfluencerThread,
          async () =>
            (await import("@/pages/customer-center-buyer"))
              .CustomerCenterInfluencerPage,
        ),
      ]),

      // 마이페이지. 셸은 MypageLayout이 맡음.
      requireSessionRoute(MypageLayout, [
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
      ]),

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
