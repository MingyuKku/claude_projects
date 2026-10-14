import { tryit } from "radash";

import { formLogin } from "@/entities/session";
import { socialLink } from "@/features/social-login";
import { isApiError } from "@/shared/api";

import {
  CREDENTIAL_MISMATCH_MESSAGE,
  LINK_FAILED_MESSAGE,
  LINK_SUCCESS_CODE,
  LOGIN_ERROR_MESSAGE,
  MISSING_SNS_DATA_MESSAGE,
} from "../model/constants";

import type { SocialLoginPayload } from "@/features/social-login";

export type LinkAccountResult =
  { isLinked: true } | { isLinked: false; message: string };

function failed(message: string): LinkAccountResult {
  return { isLinked: false, message };
}

async function requestLink(
  id: string,
  password: string,
  snsData: SocialLoginPayload | undefined,
): Promise<LinkAccountResult> {
  const login = await formLogin(id, password);
  if (!login.result) return failed(CREDENTIAL_MISMATCH_MESSAGE);
  if (!snsData) return failed(MISSING_SNS_DATA_MESSAGE);
  if (!login.userIdx) return failed(LINK_FAILED_MESSAGE);

  const link = await socialLink(
    snsData.platform,
    login.userIdx,
    snsData.email ?? "",
    snsData.uid ?? "",
  );
  if (link.code !== LINK_SUCCESS_CODE) return failed(LINK_FAILED_MESSAGE);
  return { isLinked: true };
}

/** Logs in to an existing account and links the SNS identity to it. */
export async function linkAccount(
  id: string,
  password: string,
  snsData: SocialLoginPayload | undefined,
): Promise<LinkAccountResult> {
  const [error, result] = await tryit(requestLink)(id, password, snsData);
  if (!error) return result;
  return failed(isApiError(error) ? LOGIN_ERROR_MESSAGE : LINK_FAILED_MESSAGE);
}
