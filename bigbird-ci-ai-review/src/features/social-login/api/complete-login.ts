import { loadNaverScript } from "../lib/load-script";
import { parseAppleCallback } from "../lib/social-outcome";
import { createNaverLogin, ensureKakaoSdk } from "../lib/start-login";
import { KAKAO_PROFILE_URL } from "../model/constants";
import { applyAuthSuccess, googleLogin, socialLogin } from "./social-login-api";

import type { SocialLoginOutcome } from "../model/schema";
import type { KakaoProfile } from "../model/sdk-types";

const FAILED: SocialLoginOutcome = { status: "failed" };

/** Kakao callback: read the profile through the SDK and pass it to our server. */
export async function completeKakaoLogin(): Promise<SocialLoginOutcome> {
  const kakao = await ensureKakaoSdk();
  const profile = await new Promise<KakaoProfile | null>((resolve) => {
    kakao.API.request({
      url: KAKAO_PROFILE_URL,
      success: resolve,
      fail: () => resolve(null),
    });
  });
  if (!profile) return FAILED;
  return socialLogin({
    platform: "kakao",
    uid: String(profile.id),
    email: profile.kakao_account?.email,
  });
}

/** Naver callback: the SDK reads the token from the URL hash and reports login state. */
export async function completeNaverLogin(): Promise<SocialLoginOutcome> {
  await loadNaverScript();
  const naverLogin = createNaverLogin();
  const isLoggedIn = await new Promise<boolean>((resolve) => {
    naverLogin.getLoginStatus(resolve);
  });
  if (!isLoggedIn) return FAILED;
  return socialLogin({
    platform: "naver",
    uid: naverLogin.user.id,
    email: naverLogin.user.email,
  });
}

/** Google callback: the authorization code arrives in the query string. */
export async function completeGoogleLogin(
  search: string,
): Promise<SocialLoginOutcome> {
  const code = new URLSearchParams(search).get("code");
  if (!code) return FAILED;
  return googleLogin(code);
}

export async function completeAppleLogin(
  search: string,
): Promise<SocialLoginOutcome> {
  const result = parseAppleCallback(search);
  if (result.status === "success") {
    await applyAuthSuccess(result.authorization);
    return { status: "success" };
  }
  if (result.status === "needsLink") {
    return {
      status: "needsLink",
      snsData: { platform: "apple", uid: result.uid, email: result.email },
    };
  }
  return FAILED;
}
