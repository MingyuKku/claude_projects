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
} from "../model/schema";

import type {
  SocialLinkResult,
  SocialLoginOutcome,
  SocialLoginPayload,
} from "../model/schema";

/**
 * Plants the Authorization cookie and opens the session via `/jwt/login`.
 * `Secure` is left off on purpose: browsers ignore it on the http dev server.
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
  // An unregistered SNS account: hand its identity to the link screen.
  if (isNeedsLink(data.code)) return { status: "needsLink", snsData: payload };
  return { status: "failed" };
}

/** Only Google's authorization code is exchanged by the server. */
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
        platform: "google",
        uid: data.tokenResponse?.uid,
        email: data.tokenResponse?.email,
      },
    };
  }
  return { status: "failed" };
}

/** Links an SNS account to an existing account (advertiser backend). */
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
