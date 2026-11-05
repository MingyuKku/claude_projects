import { ENV } from "@/shared/config";

import { createHttpClient } from "./http-client";

/** 광고주 백엔드(V2 경로): 폼 로그인, 계정 전환, 만료 비밀번호, 본인인증 복호화. */
export const serverApi = createHttpClient(ENV.apiServerUrl);

/**
 * 광고주 백엔드의 `/v3` 경로(세션 `/sec`, SNS 로그인·연결, 로그아웃, 마이페이지, 고객센터 등).
 * 백엔드가 API를 `/v3`로 점진 이전 중이라 V2 경로는 `serverApi`가 맡음. 전부 이전되면 `serverApi` 기준 URL에 합침.
 */
export const serverApiV3 = createHttpClient(`${ENV.apiServerUrl}/v3`);

/** Member backend: sign-up, id/password lookup, identity verification. */
export const memberApi = createHttpClient(ENV.apiMemberUrl);

/**
 * 결제 서버(bigbird-pay-be). 세션 쿠키 없이 요청함(v2와 같음, `withCredentials: false`): 이 서버는 광고주 세션이 아니라
 * `/v3/mypage/bigbird-money/init`이 준 암호화된 사용자 값으로 사용자를 알아보고, 쿠키를 보내면 CORS가 막힐 수 있음.
 */
export const payApi = createHttpClient(ENV.apiPayUrl, { credentials: "omit" });

/**
 * Unified auth server, used only by the Kakao Talk verification flow. Credentials
 * are sent because `/lookup` may set a temporary verification-session cookie that
 * the `/verification/*` calls need again.
 */
export const authApi = createHttpClient(ENV.apiAuthUrl);
