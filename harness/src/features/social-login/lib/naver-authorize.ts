import { ENV, ROUTES } from "@/shared/config";

import { NAVER_AUTHORIZE_URL } from "../model/constants";

// 네이버 JS SDK 2.0.2는 access token을 주소 해시로 돌려주는데 서버는 앱을 확인할 수 없어, 로그인·연결 모두 SDK 없이
// 인가 주소(`response_type=code`)로 이동해 인가 코드를 받고 서버가 교환함(2026-11-03 백엔드 `{ code, state }`).

/** 네이버가 인가 코드를 돌려줄 주소. 개발자센터에 등록된 Callback URL과 정확히 같아야 함. */
export function naverRedirectUri() {
  return `${ENV.oauthRedirectUrl}${ROUTES.authNaver}`;
}

export function buildNaverAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.naverClientId,
    redirect_uri: naverRedirectUri(),
    state,
  });
  return `${NAVER_AUTHORIZE_URL}?${params.toString()}`;
}
