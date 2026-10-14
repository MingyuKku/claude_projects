// Typed access to build-time env. Read env only through this object so a missing
// variable has one place to be noticed. Values are public: Vite inlines VITE_*
// variables into the bundle, so never put secrets here.
export const ENV = {
  // API base values are path prefixes (not absolute URLs): the dev proxy and the
  // production reverse proxy forward them, because the backends' CORS allowlists
  // do not include this app's origin.
  apiServerUrl: import.meta.env.VITE_API_SERVER_URL,
  apiMemberUrl: import.meta.env.VITE_API_MEMBER_URL,
  apiSocialUrl: import.meta.env.VITE_API_SOCIAL_URL,
  apiAuthUrl: import.meta.env.VITE_API_AUTH_URL,
  oauthRedirectUrl: import.meta.env.VITE_OAUTH_REDIRECT_URL,
  naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID,
  kakaoAppKey: import.meta.env.VITE_KAKAO_APP_KEY,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID,
  appleRedirectUrl: import.meta.env.VITE_APPLE_REDIRECT_URL,
  domain: import.meta.env.VITE_DOMAIN,
} as const;
