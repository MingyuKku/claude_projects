import { tryit } from "radash";

import { formLogin } from "@/entities/session";
import { linkSnsWithToken } from "@/features/social-login";
import { isApiError } from "@/shared/api";

import { INVALID_CREDENTIALS_REASON } from "../model/constants";

import type { SocialLoginPayload } from "@/features/social-login";

/** 번역 키(`error.{code}`). */
export type LinkErrorCode =
  "credentialMismatch" | "missingSnsData" | "linkFailed";

/** 연동이 끝났어도 세션이 열리지 않을 수 있음(승인 전 계정은 폼 로그인만 실패함). 그때는 로그인 화면으로 보냄. */
export type LinkAccountResult =
  | { isLinked: true; isSessionOpened: boolean }
  | { isLinked: false; code: LinkErrorCode };

function failed(code: LinkErrorCode): LinkAccountResult {
  return { isLinked: false, code };
}

function readReason(data: unknown): unknown {
  if (typeof data !== "object" || data === null || !("reason" in data)) {
    return undefined;
  }
  return data.reason;
}

/**
 * 서버가 확인한 신원 토큰으로 기존 계정에 SNS를 연결함. 서버가 아이디·비밀번호를 확인해 연결하고(세션은 열지 않음),
 * 이어서 폼 로그인으로 세션을 엶.
 */
export async function linkAccount(
  id: string,
  password: string,
  snsData: SocialLoginPayload | undefined,
): Promise<LinkAccountResult> {
  if (!snsData) return failed("missingSnsData");

  const [linkError] = await tryit(linkSnsWithToken)(
    id,
    password,
    snsData.snsLinkToken,
  );
  if (isApiError(linkError)) {
    const isCredentialError =
      linkError.status === 401 &&
      readReason(linkError.data) === INVALID_CREDENTIALS_REASON;
    return failed(isCredentialError ? "credentialMismatch" : "linkFailed");
  }
  if (linkError) return failed("linkFailed");

  // 연결은 이미 저장됐으므로 폼 로그인이 실패해도 연동 실패로 보이지 않게 함(승인 전 계정은 연결은 200, 로그인만 실패).
  const [loginError, login] = await tryit(formLogin)(id, password);
  return { isLinked: true, isSessionOpened: !loginError && login.result };
}
