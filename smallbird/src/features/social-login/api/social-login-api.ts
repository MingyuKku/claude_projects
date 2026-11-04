import { tryit } from "radash";

import { isApiError, serverApiV3 } from "@/shared/api";

import {
  APPLE_LOGIN_V3_PATH,
  GOOGLE_LOGIN_V3_PATH,
  KAKAO_LOGIN_V3_PATH,
  NAVER_LOGIN_V3_PATH,
  SNS_LINK_V3_PATH,
} from "../model/constants";
import {
  needSignupResponseSchema,
  snsLoginV3ResponseSchema,
} from "../model/schema";

import type { SocialLoginOutcome } from "../model/schema";
import type { ApiError } from "@/shared/api";

/**
 * V3 간편 로그인 공통. 서버가 인가 코드를 교환하고 세션 쿠키를 열어 주므로 `Authorization` 쿠키·`/jwt/login`은 쓰지 않음.
 * 가입되지 않은 계정(`404 NEED_SIGNUP`)은 서버가 확인한 신원 토큰(`snsLinkToken`)과 함께 연동 화면으로 넘김.
 * 그 밖의 거절(차단·휴면·승인 대기·코드 오류)은 `failed`로 돌려 로그인 화면으로 보냄(사유별 안내 문구는 정해지면 추가).
 */
async function snsLoginV3(
  path: string,
  body: Record<string, string>,
): Promise<SocialLoginOutcome> {
  const [error, response] = await tryit(serverApiV3.post)(path, body);
  if (isApiError(error)) return readNeedSignup(error);
  if (error) throw error;
  snsLoginV3ResponseSchema.parse(response);
  return { status: "success" };
}

/** 카카오 V3 로그인. 인가 코드와 그 코드를 받을 때 쓴 `redirectUri`를 보냄. */
export function kakaoLogin(
  code: string,
  redirectUri: string,
): Promise<SocialLoginOutcome> {
  return snsLoginV3(KAKAO_LOGIN_V3_PATH, { code, redirectUri });
}

/** 애플 V3 로그인. 팝업에서 받은 ID 토큰을 보냄(서버가 서명·`aud`를 확인). */
export function appleLogin(token: string): Promise<SocialLoginOutcome> {
  return snsLoginV3(APPLE_LOGIN_V3_PATH, { token });
}

/** 네이버 V3 로그인. 인가 코드와 인가 요청에 쓴 `state`를 보냄. */
export function naverLogin(
  code: string,
  state: string,
): Promise<SocialLoginOutcome> {
  return snsLoginV3(NAVER_LOGIN_V3_PATH, { code, state });
}

function readNeedSignup(error: ApiError): SocialLoginOutcome {
  const parsed = needSignupResponseSchema.safeParse(error.data);
  if (error.status !== 404 || !parsed.success) return { status: "failed" };
  const { platform, email, snsLinkToken } = parsed.data;
  return { status: "needsLink", snsData: { platform, email, snsLinkToken } };
}

/** 구글 V3 로그인. 인가 코드와 그 코드를 받을 때 쓴 `redirectUri`를 보냄. */
export function googleLogin(
  code: string,
  redirectUri: string,
): Promise<SocialLoginOutcome> {
  return snsLoginV3(GOOGLE_LOGIN_V3_PATH, { code, redirectUri });
}

/**
 * 서버가 확인한 신원 토큰(`snsLinkToken`)으로 아이디·비밀번호 계정에 SNS를 연결함(로그인 전 연동, 세션은 열지 않음).
 * 실패는 `ApiError`로 던짐: 400 `INVALID_SNS_LINK_TOKEN`, 401 `INVALID_CREDENTIALS`, 403 `ACCOUNT_LOCKED`·`ACCOUNT_BANNED`·`ACCOUNT_EXPIRED`,
 * 409 `SNS_ALREADY_LINKED`·`SNS_LINKED_TO_OTHER_USER`.
 */
export async function linkSnsWithToken(
  id: string,
  password: string,
  snsLinkToken: string,
): Promise<void> {
  await serverApiV3.post(SNS_LINK_V3_PATH, { id, password, snsLinkToken });
}
