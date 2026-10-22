/** 애플 콜백(서버가 다시 리다이렉트해 주는 URL)의 쿼리 키와 성공 상태값. */
export const APPLE_CALLBACK_PARAM = {
  status: "status",
  code: "code",
  idToken: "idtoken",
  uid: "uid",
  email: "email",
} as const;
export const APPLE_CALLBACK_STATUS_SUCCESS = "success";

/** 구글 콜백이 인가 코드를 담아 주는 쿼리 키. */
export const GOOGLE_CODE_PARAM = "code";

export const CODE_SUCCESS = "C01";
export const CODE_NEEDS_LINK = "C02";

export const NAVER_SCRIPT_SRC =
  "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2-nopolyfill.js";
export const KAKAO_SCRIPT_SRC =
  "https://developers.kakao.com/sdk/js/kakao.min.js";
export const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_SCRIPT_ID = "google-jssdk";
export const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
export const APPLE_SCRIPT_ID = "appleid-sdk";

export const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/admob.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
export const APPLE_SCOPE = "name email";

export const KAKAO_PROFILE_URL = "/v2/user/me";
export const BEARER_PREFIX = "Bearer ";
export const AUTHORIZATION_COOKIE = "Authorization";

export const SOCIAL_LOGIN_PATH = "/api/v1/bigbird/login/client";
export const GOOGLE_OAUTH_PATH = "/api/v1/bigbird/oauth/client/google";
export const JWT_LOGIN_PATH = "/jwt/login";
export const SOCIAL_LINK_PATH = "/auth";
