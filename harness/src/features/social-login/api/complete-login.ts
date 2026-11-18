import { tryit } from "radash";

import { requestAppleCode } from "../lib/apple-authorize";
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

/**
 * 애플 로그인: 팝업에서 받은 인가 코드를 V3 로그인 API에 넘김. 팝업을 닫았으면 `cancelled`.
 * 팝업을 열기까지의 오류(SDK 없음·`state` 불일치)는 던져 시작 실패로 알리고, 코드를 받은 뒤의 오류(네트워크·응답 형태)는
 * 다른 공급자의 복귀 화면처럼 로그인 실패(`failed`)로 돌려줌.
 */
export async function loginWithApple(): Promise<
  SocialLoginOutcome | { status: "cancelled" }
> {
  const apple = await requestAppleCode();
  if (!apple) return { status: "cancelled" };
  const [error, outcome] = await tryit(appleLogin)(
    apple.code,
    apple.redirectUri,
  );
  if (!error) return outcome;
  console.error(error);
  return FAILED;
}
