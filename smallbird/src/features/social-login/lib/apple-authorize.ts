import { ENV, ROUTES } from "@/shared/config";

import { APPLE_CANCEL_ERRORS, APPLE_SCOPE } from "../model/constants";
import { loadAppleScript } from "./load-script";
import { createState } from "./oauth-state";
import "../model/sdk-types";

// 애플은 팝업(`usePopup`)으로 인가 코드를 받아 `{ code, redirectUri }`로 서버에 보냄(서버가 코드를 교환). 팝업은 페이지를 옮기지 않으므로
// 콜백 화면과 `sessionStorage` 의도 저장이 필요 없고, `signIn()`이 돌려준 `state`를 시작할 때 만든 값과 비교함.
// `redirectURI`는 이동하지 않지만 애플 콘솔에 등록된 Return URL과 같아야 하고 호스트는 도메인이어야 함(IP·`localhost` 불가).

/** 애플 콘솔 Services ID의 Return URL. 다른 제공자와 같은 규칙(`<도메인>/auth/{platform}`). */
export function appleRedirectUri() {
  return `${ENV.oauthRedirectUrl}${ROUTES.authApple}`;
}

/** 애플 팝업이 돌려준 인가 코드와 서버가 교환할 때 쓸 `redirectUri`. */
export interface AppleCode {
  code: string;
  redirectUri: string;
}

/** 화면에 들어올 때 SDK를 미리 불러 둠. 클릭 뒤에 불러오면 팝업이 사용자 동작과 떨어져 브라우저가 막을 수 있음. */
export function preloadAppleSdk(): Promise<void> {
  return loadAppleScript();
}

function isCancelled(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("error" in error)) {
    return false;
  }
  return APPLE_CANCEL_ERRORS.includes(String(error.error));
}

/**
 * 애플 팝업을 열어 인가 코드를 받음. 사용자가 팝업을 닫거나 취소하면 null.
 * `redirectUri`는 `init`에 넣은 값과 글자까지 같아야 서버가 코드를 교환함(다르면 `INVALID_SNS_CODE`).
 * `state`가 다르거나 코드가 없으면 요청 위조·SDK 이상으로 보고 오류를 던짐.
 */
export async function requestAppleCode(): Promise<AppleCode | null> {
  await loadAppleScript();
  if (!window.AppleID) throw new Error("애플 SDK 가 없습니다");
  const state = createState();
  const redirectUri = appleRedirectUri();
  window.AppleID.auth.init({
    clientId: ENV.appleClientId,
    scope: APPLE_SCOPE,
    redirectURI: redirectUri,
    state,
    usePopup: true,
  });
  try {
    const { authorization } = await window.AppleID.auth.signIn();
    if (authorization.state !== state || !authorization.code) {
      throw new Error("애플 응답이 올바르지 않습니다");
    }
    return { code: authorization.code, redirectUri };
  } catch (error) {
    if (isCancelled(error)) return null;
    throw error;
  }
}
