import {
  APPLE_CALLBACK_PARAM,
  APPLE_CALLBACK_STATUS_SUCCESS,
  BEARER_PREFIX,
  CODE_NEEDS_LINK,
  CODE_SUCCESS,
} from "../model/constants";

import type { SocialLoginResponse } from "../model/schema";

type SocialLoginData = SocialLoginResponse["data"];

/** C01 응답으로 Authorization 헤더 값을 만듦. */
export function readAuthorization(data: SocialLoginData): string {
  const { tokenType = "", accessToken = "" } = data.tokenResponse ?? {};
  return tokenType + accessToken;
}

export function isLoginSuccess(code: string): boolean {
  return code === CODE_SUCCESS;
}

export function isNeedsLink(code: string): boolean {
  return code === CODE_NEEDS_LINK;
}

export type AppleCallbackResult =
  | { status: "success"; authorization: string }
  | { status: "needsLink"; uid: string; email: string }
  | { status: "failed" };

/**
 * 애플은 폼을 POST하므로 서버가 먼저 받아 결과를 쿼리 문자열에 담아 다시
 * 리다이렉트함. 여기서는 SDK를 다시 호출하지 않음.
 */
export function parseAppleCallback(search: string): AppleCallbackResult {
  const params = new URLSearchParams(search);
  if (params.get(APPLE_CALLBACK_PARAM.status) !== APPLE_CALLBACK_STATUS_SUCCESS)
    return { status: "failed" };

  const code = params.get(APPLE_CALLBACK_PARAM.code) ?? "";
  if (isLoginSuccess(code)) {
    return {
      status: "success",
      authorization: `${BEARER_PREFIX}${decodeURIComponent(params.get(APPLE_CALLBACK_PARAM.idToken) ?? "")}`,
    };
  }
  if (isNeedsLink(code)) {
    return {
      status: "needsLink",
      uid: decodeURIComponent(params.get(APPLE_CALLBACK_PARAM.uid) ?? ""),
      email: decodeURIComponent(params.get(APPLE_CALLBACK_PARAM.email) ?? ""),
    };
  }
  return { status: "failed" };
}
