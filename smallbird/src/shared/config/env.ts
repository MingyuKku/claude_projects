// 빌드 시점 환경 변수에 타입을 붙여 접근함. 누락된 변수를 한 곳에서 알아챌 수
// 있도록 환경 변수는 이 객체로만 읽음. 값은 공개됨. Vite가 VITE_* 변수를
// 번들에 그대로 넣으므로 비밀 값은 넣지 않음.
export const ENV = {
  // API 기준 값. 배포 환경은 백엔드 절대 주소(백엔드가 배포 도메인을 CORS 허용),
  // 로컬 개발은 경로 접두사를 넣고 개발 서버 프록시가 전달함.
  apiServerUrl: import.meta.env.VITE_API_SERVER_URL,
  apiMemberUrl: import.meta.env.VITE_API_MEMBER_URL,
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
  // 웹푸시(FCM). 같은 프로젝트에 추가한 웹 앱의 appId이고, 없으면 위 appId를 씀. 값이 없는 환경(운영 프로젝트 미정)은 기능을 끔.
  firebasePushAppId: import.meta.env.VITE_FIREBASE_PUSH_APP_ID,
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  firebaseVapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
} as const;

/** 웹푸시 토큰을 받는 데 필요한 Firebase 설정이 모두 있는지. 없으면 웹푸시 기능 전체를 끔. */
export function isWebPushConfigured() {
  return Boolean(
    ENV.firebaseApiKey &&
    ENV.firebaseProjectId &&
    ENV.firebaseMessagingSenderId &&
    ENV.firebaseVapidKey &&
    (ENV.firebasePushAppId || ENV.firebaseAppId),
  );
}
