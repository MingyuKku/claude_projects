import { requestAppleIdToken } from "../lib/apple-authorize";
import { takeGoogleLoginCallback } from "../lib/google-login";
import { takeKakaoLoginCallback } from "../lib/kakao-login";
import { takeNaverLoginCallback } from "../lib/naver-login";
import {
  appleLogin,
  googleLogin,
  kakaoLogin,
  naverLogin,
} from "./social-login-api";

import type { SocialLoginOutcome } from "../model/schema";

const FAILED: SocialLoginOutcome = { status: "failed" };

/** 카카오 콜백: 우리가 시작한 로그인(`state` 일치)일 때만 인가 코드를 V3 로그인 API에 넘김. */
export async function completeKakaoLogin(
  search: string,
): Promise<SocialLoginOutcome> {
  const callback = takeKakaoLoginCallback(search);
  if (!callback) return FAILED;
  // 인가 코드가 주소·방문 기록에 남지 않게 쿼리를 지움.
  history.replaceState(null, "", window.location.pathname);
  return kakaoLogin(callback.code, callback.redirectUri);
}

/** 네이버 콜백: 우리가 시작한 로그인(`state` 일치)일 때만 인가 코드와 `state`를 V3 로그인 API에 넘김. */
export async function completeNaverLogin(
  search: string,
): Promise<SocialLoginOutcome> {
  const callback = takeNaverLoginCallback(search);
  if (!callback) return FAILED;
  // 인가 코드가 주소·방문 기록에 남지 않게 쿼리를 지움.
  history.replaceState(null, "", window.location.pathname);
  return naverLogin(callback.code, callback.state);
}

/** 구글 콜백: 우리가 시작한 로그인(`state` 일치)일 때만 인가 코드를 V3 로그인 API에 넘김. */
export async function completeGoogleLogin(
  search: string,
): Promise<SocialLoginOutcome> {
  const callback = takeGoogleLoginCallback(search);
  if (!callback) return FAILED;
  // 인가 코드가 주소·방문 기록에 남지 않게 쿼리를 지움.
  history.replaceState(null, "", window.location.pathname);
  return googleLogin(callback.code, callback.redirectUri);
}

/** 애플 로그인: 팝업에서 받은 ID 토큰을 V3 로그인 API에 넘김. 팝업을 닫았으면 `cancelled`. */
export async function loginWithApple(): Promise<
  SocialLoginOutcome | { status: "cancelled" }
> {
  const token = await requestAppleIdToken();
  if (!token) return { status: "cancelled" };
  return appleLogin(token);
}
