import { serverApi, socialApi } from "@/shared/api";

import {
  isLoginSuccess,
  isNeedsLink,
  readAuthorization,
} from "../lib/social-outcome";
import {
  AUTHORIZATION_COOKIE,
  GOOGLE_OAUTH_PATH,
  JWT_LOGIN_PATH,
  SOCIAL_LINK_PATH,
  SOCIAL_LOGIN_PATH,
} from "../model/constants";
import {
  socialLinkResultSchema,
  socialLoginResponseSchema,
  socialPlatformSchema,
} from "../model/schema";

import type {
  SocialLinkResult,
  SocialLoginOutcome,
  SocialLoginPayload,
} from "../model/schema";

/**
 * Authorization 쿠키를 심고 `/jwt/login`으로 세션을 엶.
 * `Secure`는 일부러 뺌. 브라우저가 http 개발 서버에서는 무시하기 때문.
 */
export async function applyAuthSuccess(authorization: string): Promise<void> {
  document.cookie = `${AUTHORIZATION_COOKIE}=${encodeURIComponent(authorization)}; Path=/; SameSite=Lax`;
  await serverApi.get(JWT_LOGIN_PATH, {
    headers: { Authorization: authorization },
  });
}

export async function socialLogin(
  payload: SocialLoginPayload,
): Promise<SocialLoginOutcome> {
  const response = await socialApi.post(
    `${SOCIAL_LOGIN_PATH}/${payload.platform}`,
    payload,
  );
  const { data } = socialLoginResponseSchema.parse(response);

  if (isLoginSuccess(data.code)) {
    await applyAuthSuccess(readAuthorization(data));
    return { status: "success" };
  }
  // 미가입 SNS 계정: 신원 정보를 연동 화면으로 넘김.
  if (isNeedsLink(data.code)) return { status: "needsLink", snsData: payload };
  return { status: "failed" };
}

/** 구글만 인가 코드를 서버가 교환함. */
export async function googleLogin(
  authorizeCode: string,
): Promise<SocialLoginOutcome> {
  const response = await socialApi.post(GOOGLE_OAUTH_PATH, { authorizeCode });
  const { data } = socialLoginResponseSchema.parse(response);

  if (isLoginSuccess(data.code)) {
    await applyAuthSuccess(readAuthorization(data));
    return { status: "success" };
  }
  if (isNeedsLink(data.code)) {
    return {
      status: "needsLink",
      snsData: {
        platform: socialPlatformSchema.enum.google,
        uid: data.tokenResponse?.uid,
        email: data.tokenResponse?.email,
      },
    };
  }
  return { status: "failed" };
}

/** SNS 계정을 기존 계정에 연동함(광고주 백엔드). */
export async function socialLink(
  platform: string,
  userIdx: number,
  email: string,
  uid: string,
): Promise<SocialLinkResult> {
  const response = await serverApi.put(
    `${SOCIAL_LINK_PATH}/${platform}/${userIdx}`,
    {
      platform,
      email,
      uid,
    },
  );
  return socialLinkResultSchema.parse(response);
}
