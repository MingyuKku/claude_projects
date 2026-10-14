import {
  BEARER_PREFIX,
  CODE_NEEDS_LINK,
  CODE_SUCCESS,
} from "../model/constants";

import type { SocialLoginResponse } from "../model/schema";

type SocialLoginData = SocialLoginResponse["data"];

/** Builds the Authorization header value from a C01 response. */
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
 * Apple posts a form, so the server receives it first and redirects back with the
 * result in the query string; the SDK is not called again here.
 */
export function parseAppleCallback(search: string): AppleCallbackResult {
  const params = new URLSearchParams(search);
  if (params.get("status") !== "success") return { status: "failed" };

  const code = params.get("code") ?? "";
  if (isLoginSuccess(code)) {
    return {
      status: "success",
      authorization: `${BEARER_PREFIX}${decodeURIComponent(params.get("idtoken") ?? "")}`,
    };
  }
  if (isNeedsLink(code)) {
    return {
      status: "needsLink",
      uid: decodeURIComponent(params.get("uid") ?? ""),
      email: decodeURIComponent(params.get("email") ?? ""),
    };
  }
  return { status: "failed" };
}
