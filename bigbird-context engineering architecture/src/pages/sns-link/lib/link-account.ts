import { tryit } from "radash";

import { formLogin } from "@/entities/session";
import { socialLink } from "@/features/social-login";
import { isApiError } from "@/shared/api";

import { LINK_SUCCESS_CODE } from "../model/constants";

import type { SocialLoginPayload } from "@/features/social-login";

/** 번역 키(`error.{code}`). */
export type LinkErrorCode =
  "credentialMismatch" | "missingSnsData" | "linkFailed" | "loginError";

export type LinkAccountResult =
  { isLinked: true } | { isLinked: false; code: LinkErrorCode };

function failed(code: LinkErrorCode): LinkAccountResult {
  return { isLinked: false, code };
}

async function requestLink(
  id: string,
  password: string,
  snsData: SocialLoginPayload | undefined,
): Promise<LinkAccountResult> {
  const login = await formLogin(id, password);
  if (!login.result) return failed("credentialMismatch");
  if (!snsData) return failed("missingSnsData");
  if (!login.userIdx) return failed("linkFailed");

  const link = await socialLink(
    snsData.platform,
    login.userIdx,
    snsData.email ?? "",
    snsData.uid ?? "",
  );
  if (link.code !== LINK_SUCCESS_CODE) return failed("linkFailed");
  return { isLinked: true };
}

/** 기존 계정으로 로그인한 뒤 SNS 신원을 그 계정에 연동함. */
export async function linkAccount(
  id: string,
  password: string,
  snsData: SocialLoginPayload | undefined,
): Promise<LinkAccountResult> {
  const [error, result] = await tryit(requestLink)(id, password, snsData);
  if (!error) return result;
  return failed(isApiError(error) ? "loginError" : "linkFailed");
}
