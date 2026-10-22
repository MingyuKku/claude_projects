// 라우트 경로의 단일 출처. features/widgets가 app 레이어를 임포트하지 않고
// 링크를 만들 수 있도록 shared에 둠.
// 일부 경로는 이 앱 밖에서도 쓰임. OAuth 리다이렉트 URI는 각 제공자 콘솔에
// 등록되어 있고, 비밀번호 재설정 링크와 KMC 복귀 URL은 백엔드/벤더가 만듦.
// 이 경로를 바꾸면 상대편도 함께 바꿔야 함.
export const ROUTES = {
  home: "/",
  introduction: "/introduction",
  login: "/login",
  logout: "/logout",
  main: "/",
  switchAccount: "/a/change",
  customerCenterBigbird: "/customer-center/bigbird",
  customerCenterBigbirdNew: "/customer-center/bigbird/new",
  // 목록과 대화는 같은 화면이라 한 라우트(선택 세그먼트)로 둠.
  customerCenterBigbirdThread: "/customer-center/bigbird/:threadIdx?",
  customerCenterBuyer: "/customer-center/buyer",
  // 구매자 문의도 목록과 대화가 한 화면. `inquiryKey`는 출처를 담은 임시 키.
  customerCenterBuyerThread: "/customer-center/buyer/:inquiryKey?",
  mypageSubscribe: "/mypage/subscribe",
  mypageMoney: "/mypage/money",
  mypageAccount: "/mypage/account",
  legacyMain: "/main",
  influencerSearch: "/influencers/search",
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
  // 개발 서버 전용 화면 (공통 컴포넌트 미리보기)
  uiPreview: "/dev/ui",
} as const;
