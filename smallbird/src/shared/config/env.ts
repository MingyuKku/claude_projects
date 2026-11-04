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
  // 결제 서버(bigbird-pay-be). 빅버드 머니 충전에서 결제 요청을 직접 보냄.
  apiPayUrl: import.meta.env.VITE_API_PAY_URL,
  // KG이니시스 표준결제 스크립트 주소. 운영과 테스트가 달라 환경마다 지정함.
  inicisStdPayUrl: import.meta.env.VITE_INICIS_STDPAY_URL,
  oauthRedirectUrl: import.meta.env.VITE_OAUTH_REDIRECT_URL,
  naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID,
  // 카카오 REST API 키. 인가 주소에 들어가는 공개 값이고, 클라이언트 시크릿은 백엔드에만 둠.
  kakaoRestApiKey: import.meta.env.VITE_KAKAO_REST_API_KEY,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID,
  domain: import.meta.env.VITE_DOMAIN,
  // 헬프데스크 Firebase 프로젝트(실시간 상담). 웹 설정 값은 공개되어도 됨.
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const;
