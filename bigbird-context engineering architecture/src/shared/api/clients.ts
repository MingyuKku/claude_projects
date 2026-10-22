import { ENV } from "@/shared/config";

import { createHttpClient } from "./http-client";

/** Advertiser backend: session (`/sec`), form login, SNS linking. */
export const serverApi = createHttpClient(ENV.apiServerUrl);

/**
 * 광고주 백엔드의 `/v3` 경로. 백엔드가 API를 `/v3`로 점진 이전 중이라 지금은
 * 고객센터(`/v3/help/**`)만 쓴다. 전부 이전되면 `serverApi` 기준 URL에 합친다.
 */
export const serverApiV3 = createHttpClient(`${ENV.apiServerUrl}/v3`);

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
