import { loadNaverScript } from "../lib/load-script";
import { parseAppleCallback } from "../lib/social-outcome";
import { createNaverLogin, ensureKakaoSdk } from "../lib/start-login";
import { GOOGLE_CODE_PARAM, KAKAO_PROFILE_URL } from "../model/constants";
import { socialPlatformSchema } from "../model/schema";
import { applyAuthSuccess, googleLogin, socialLogin } from "./social-login-api";

import type { SocialLoginOutcome } from "../model/schema";
import type { KakaoProfile } from "../model/sdk-types";

const FAILED: SocialLoginOutcome = { status: "failed" };

/** 카카오 콜백: SDK로 프로필을 읽어 우리 서버에 넘김. */
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
    platform: socialPlatformSchema.enum.kakao,
    uid: String(profile.id),
    email: profile.kakao_account?.email,
  });
}

/** 네이버 콜백: SDK가 URL 해시에서 토큰을 읽고 로그인 상태를 알려 줌. */
export async function completeNaverLogin(): Promise<SocialLoginOutcome> {
  await loadNaverScript();
  const naverLogin = createNaverLogin();
  const isLoggedIn = await new Promise<boolean>((resolve) => {
    naverLogin.getLoginStatus(resolve);
  });
  if (!isLoggedIn) return FAILED;
  return socialLogin({
    platform: socialPlatformSchema.enum.naver,
    uid: naverLogin.user.id,
    email: naverLogin.user.email,
  });
}

/** 구글 콜백: 인가 코드가 쿼리 문자열로 들어옴. */
export async function completeGoogleLogin(
  search: string,
): Promise<SocialLoginOutcome> {
  const code = new URLSearchParams(search).get(GOOGLE_CODE_PARAM);
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
      snsData: {
        platform: socialPlatformSchema.enum.apple,
        uid: result.uid,
        email: result.email,
      },
    };
  }
  return FAILED;
}
