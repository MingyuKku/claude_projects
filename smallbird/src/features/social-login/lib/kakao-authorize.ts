import { ENV, ROUTES } from "@/shared/config";

import { KAKAO_AUTHORIZE_URL } from "../model/constants";

// 카카오 JS SDK v1은 2026-12-31에 종료되고 v2는 토큰을 받는 팝업이 없어, 로그인·연결 모두 SDK 없이 REST 인가 주소로 이동해 인가 코드를 받음(서버가 교환).
// 인가 요청과 토큰 교환은 같은 REST API 키여야 하므로 프론트는 REST API 키(공개 값)로 이동함.

/** 카카오가 인가 코드를 돌려줄 주소. 콘솔에 등록된 값이고, 서버에도 같은 값을 `redirectUri`로 넘김. */
export function kakaoRedirectUri() {
  return `${ENV.oauthRedirectUrl}${ROUTES.authKakao}`;
}

export function buildKakaoAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.kakaoRestApiKey,
    redirect_uri: kakaoRedirectUri(),
    state,
  });
  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`;
}
