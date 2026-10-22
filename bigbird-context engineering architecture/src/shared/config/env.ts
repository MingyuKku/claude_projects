// 빌드 시점 환경 변수에 타입을 붙여 접근함. 누락된 변수를 한 곳에서 알아챌 수
// 있도록 환경 변수는 이 객체로만 읽음. 값은 공개됨. Vite가 VITE_* 변수를
// 번들에 그대로 넣으므로 비밀 값은 넣지 않음.
export const ENV = {
  // API 기준 값은 절대 URL이 아니라 경로 접두사. 백엔드 CORS 허용 목록에
  // 이 앱의 출처가 없어서 개발 프록시와 운영 리버스 프록시가 대신 전달함.
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
  // 헬프데스크 Firebase 프로젝트(실시간 상담). 웹 설정 값은 공개되어도 됨.
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const;
