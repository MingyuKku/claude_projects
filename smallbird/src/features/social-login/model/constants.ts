/** 구글 콜백이 인가 코드를 담아 주는 쿼리 키. */
export const GOOGLE_CODE_PARAM = "code";

export const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_SCRIPT_ID = "google-jssdk";
export const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
export const APPLE_SCRIPT_ID = "appleid-sdk";

/** 서버는 인가 코드를 바꿔 받은 ID 토큰의 `sub`·이메일만 씀. `openid`는 필수. */
export const GOOGLE_SCOPE = "openid email profile";
/** 서버는 ID 토큰의 `sub`·이메일만 쓰므로 이름은 요청하지 않음. */
export const APPLE_SCOPE = "email";
/** 팝업에서 사용자가 창을 닫거나 취소할 때 `signIn()`이 reject하는 `error` 값. */
export const APPLE_CANCEL_ERRORS = [
  "popup_closed_by_user",
  "user_cancelled_authorize",
];

/** 네이버 인가 코드 요청 주소. SDK 없이 이 주소로 이동하고, 코드는 서버가 Client ID·Secret으로 교환함. */
export const NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";

/** 연결·로그인 의도를 돌아올 때까지 들고 있는 `sessionStorage` 키(공급자·의도별)와 공통 유효 시간. */
export const NAVER_LINK_INTENT_KEY = "bigbird.naver-link-intent";
export const NAVER_LOGIN_INTENT_KEY = "bigbird.naver-login-intent";
export const GOOGLE_LINK_INTENT_KEY = "bigbird.google-link-intent";
export const GOOGLE_LOGIN_INTENT_KEY = "bigbird.google-login-intent";
export const KAKAO_LINK_INTENT_KEY = "bigbird.kakao-link-intent";
export const KAKAO_LOGIN_INTENT_KEY = "bigbird.kakao-login-intent";
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** 구글·카카오가 인가 코드와 함께 돌려주는 쿼리 키(`state`는 연결 시작 때 실은 값). */
export const GOOGLE_STATE_PARAM = "state";
export const NAVER_CODE_PARAM = "code";
export const NAVER_STATE_PARAM = "state";
export const KAKAO_CODE_PARAM = "code";
export const KAKAO_STATE_PARAM = "state";

/** 카카오 REST 인가 코드 요청 주소. SDK 없이 이 주소로 이동하고, 코드는 서버가 REST API 키로 교환함. */
export const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

/** V3 간편 로그인(`serverApiV3` 기준). 카카오는 인가 코드 `{ code, redirectUri }`를 받아 서버가 교환하고 세션 쿠키를 엶. */
export const KAKAO_LOGIN_V3_PATH = "/auth/sns/kakao/login";
/** 구글 V3 로그인. 카카오와 같이 `{ code, redirectUri }`를 보내면 서버가 교환하고 세션 쿠키를 엶. */
export const GOOGLE_LOGIN_V3_PATH = "/auth/sns/google/login";
/** 애플 V3 로그인. 팝업에서 받은 인가 코드 `{ code, redirectUri }`를 보내면 서버가 교환하고 세션 쿠키를 엶. */
export const APPLE_LOGIN_V3_PATH = "/auth/sns/apple/login";
/** 네이버 V3 로그인. 서버가 `{ code, state }`로 토큰을 교환하고 세션 쿠키를 엶(`state`는 인가 요청에 쓴 값). */
export const NAVER_LOGIN_V3_PATH = "/auth/sns/naver/login";
/** 로그인 전 연동. `{ id, password, snsLinkToken }`로 가입 직후나 기존 계정에 SNS를 연결함. */
export const SNS_LINK_V3_PATH = "/auth/sns/link";
