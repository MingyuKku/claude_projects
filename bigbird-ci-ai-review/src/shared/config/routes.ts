// Single source of truth for route paths. Lives in shared so features/widgets can
// build links without importing the app layer.
// Some paths are also known outside this app: OAuth redirect URIs are registered in
// each provider console, and the password reset link and KMC return URL are produced
// by the backend/vendor. Renaming those means updating the other side too.
export const ROUTES = {
  home: "/",
  introduction: "/introduction",
  login: "/login",
  logout: "/logout",
  main: "/main",
  find: "/find",
  findEmailSent: "/find/email-sent",
  join: "/join",
  welcome: "/welcome",
  changePassword: "/changePw",
  snsLink: "/sns-link",
  cert: "/cert",
  certSuccess: "/cert/success",
  expired: "/expired",
  terms: "/terms",
  authKakao: "/auth/kakao",
  authNaver: "/auth/naver",
  authGoogle: "/auth/google",
  authApple: "/auth/apple",
} as const;
