import { ENV, ROUTES } from "@/shared/config";

import { APPLE_SCOPE, GOOGLE_SCOPE } from "../model/constants";
import {
  loadAppleScript,
  loadGoogleScript,
  loadKakaoScript,
  loadNaverScript,
} from "./load-script";
import "../model/sdk-types";

// SDKs are fetched on click: loading all four on screen entry would slow the
// first paint for scripts most users never use.

export function createNaverLogin() {
  if (!window.naver) throw new Error("네이버 SDK 가 없습니다");
  const naverLogin = new window.naver.LoginWithNaverId({
    clientId: ENV.naverClientId,
    isPopup: "true",
    callbackUrl: `${ENV.oauthRedirectUrl}${ROUTES.authNaver}`,
    callbackHandle: true,
  });
  naverLogin.init();
  return naverLogin;
}

export async function ensureKakaoSdk() {
  await loadKakaoScript();
  if (!window.Kakao) throw new Error("카카오 SDK 가 없습니다");
  if (!window.Kakao.isInitialized()) window.Kakao.init(ENV.kakaoAppKey);
  return window.Kakao;
}

/** Naver asks for consent in a popup and returns to the callback URL. */
export async function startNaverLogin(): Promise<void> {
  await loadNaverScript();
  createNaverLogin().authorize();
}

/** Kakao reports through callbacks; on success `onSuccess` moves to the callback screen. */
export async function startKakaoLogin(onSuccess: () => void): Promise<void> {
  const kakao = await ensureKakaoSdk();
  kakao.Auth.login({
    success: (response) => {
      if (response) onSuccess();
    },
    fail: () => {},
  });
}

/** Google returns an authorization code by redirect; the server exchanges it. */
export async function startGoogleLogin(): Promise<void> {
  await loadGoogleScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("구글 SDK 가 없습니다");
  oauth2
    .initCodeClient({
      client_id: ENV.googleClientId,
      scope: GOOGLE_SCOPE,
      ux_mode: "redirect",
      redirect_uri: `${ENV.oauthRedirectUrl}${ROUTES.authGoogle}`,
    })
    .requestCode();
}

// Calls the SDK's public `signIn()` instead of clicking a hidden
// `<input id="appleid-signin">` that the SDK would pick up by id.
export async function startAppleLogin(): Promise<void> {
  await loadAppleScript();
  if (!window.AppleID) throw new Error("애플 SDK 가 없습니다");
  window.AppleID.auth.init({
    clientId: ENV.appleClientId,
    scope: APPLE_SCOPE,
    redirectURI: ENV.appleRedirectUrl,
    responseMode: "form_post",
    usePopup: false,
  });
  window.AppleID.auth.signIn();
}
