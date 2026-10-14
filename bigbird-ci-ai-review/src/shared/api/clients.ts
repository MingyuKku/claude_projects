import { ENV } from "@/shared/config";

import { createHttpClient } from "./http-client";

/** Advertiser backend: session (`/sec`), form login, SNS linking. */
export const serverApi = createHttpClient(ENV.apiServerUrl);

/** Member backend: sign-up, id/password lookup, identity verification. */
export const memberApi = createHttpClient(ENV.apiMemberUrl);

/** Social-login relay shared by Kakao, Naver, Google and Apple. */
export const socialApi = createHttpClient(ENV.apiSocialUrl);

/**
 * Unified auth server, used only by the Kakao Talk verification flow. Credentials
 * are sent because `/lookup` may set a temporary verification-session cookie that
 * the `/verification/*` calls need again.
 */
export const authApi = createHttpClient(ENV.apiAuthUrl);
