import { ROUTES } from "@/shared/config";

import { PageFallback, RootLayout } from "../layouts/RootLayout";
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
      page(ROUTES.introduction, async () => {
        return (await import("@/pages/introduction")).IntroductionPage;
      }),

      // Login. `/logout` has no screen yet and shows the login page, as the old app did.
      page(ROUTES.login, async () => (await import("@/pages/login")).LoginPage),
      page(
        ROUTES.logout,
        async () => (await import("@/pages/login")).LoginPage,
      ),
      page(ROUTES.main, async () => (await import("@/pages/main")).MainPage),

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

      {
        path: "*",
        lazy: async () => ({
          Component: (await import("@/pages/not-found")).NotFoundPage,
        }),
      },
    ],
  },
];
