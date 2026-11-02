import { ENV, ROUTES } from "@/shared/config";

import { APPLE_SCOPE, GOOGLE_SCOPE } from "../model/constants";
import {
  loadAppleScript,
  loadGoogleScript,
  loadKakaoScript,
  loadNaverScript,
} from "./load-script";
import "../model/sdk-types";

// SDK는 클릭할 때 불러옴. 화면에 들어올 때 넷 다 불러오면 대부분의 사용자가
// 쓰지 않는 스크립트 때문에 첫 렌더가 느려짐.

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

/** 네이버는 팝업에서 동의를 받고 콜백 URL로 돌아옴. */
export async function startNaverLogin(): Promise<void> {
  await loadNaverScript();
  createNaverLogin().authorize();
}

/** 카카오는 콜백으로 결과를 알리며, 성공하면 `onSuccess`가 콜백 화면으로 이동시킴. */
export async function startKakaoLogin(onSuccess: () => void): Promise<void> {
  const kakao = await ensureKakaoSdk();
  kakao.Auth.login({
    success: (response) => {
      if (response) onSuccess();
    },
    fail: () => {},
  });
}

/** 구글은 리다이렉트로 인가 코드를 돌려주고, 서버가 이를 교환함. */
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

// SDK가 id로 찾아 쓰는 숨은 `<input id="appleid-signin">`를 클릭하지 않고
// SDK의 공개 메서드 `signIn()`을 호출함.
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
