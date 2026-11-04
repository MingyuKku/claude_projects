import { tryit } from "radash";

import { linkSocial, readFailureReason } from "@/entities/account";

import {
  GOOGLE_CODE_PARAM,
  GOOGLE_LINK_INTENT_KEY,
  GOOGLE_STATE_PARAM,
} from "../model/constants";
import { clearOAuthState, readOAuthState, saveOAuthState } from "./oauth-state";
import { googleRedirectUri, requestGoogleCode } from "./start-login";

import type { SocialLinkOutcome, SocialLinkRequest } from "@/entities/account";

// 구글은 인가 코드를 `/auth/google` 쿼리로 돌려주고 서버가 교환함. 연결 의도(`state`)가 같을 때만 로그인 대신 연결을 이어 감.

/** 구글 로그인 화면으로 전체 이동하기 전에 연결 의도를 남김. 저장소를 못 쓰면 시작하지 않고 취소로 돌려줌. */
export async function startGoogleLink(): Promise<SocialLinkRequest> {
  const state = saveOAuthState(GOOGLE_LINK_INTENT_KEY);
  if (!state) return { status: "cancelled" };
  const [error] = await tryit(requestGoogleCode)(state);
  if (error) {
    // 이동하지 못했으면 남은 의도가 다음 로그인 복귀에 영향을 주지 않게 지움.
    clearOAuthState(GOOGLE_LINK_INTENT_KEY);
    throw error;
  }
  return { status: "redirecting" };
}

/**
 * 돌아온 `/auth/google` 주소가 연결 흐름인지 읽음(부작용 없음). 쿼리의 `state`가 남겨 둔 의도와 같고 유효 시간 안일 때만
 * 인가 코드와 서버에 넘길 `redirectUri`를 돌려줌.
 */
export function readGoogleLinkCallback(
  search: string = window.location.search,
): { code: string; redirectUri: string } | null {
  const intent = readOAuthState(GOOGLE_LINK_INTENT_KEY);
  if (!intent) return null;
  const params = new URLSearchParams(search);
  const code = params.get(GOOGLE_CODE_PARAM);
  if (!code || params.get(GOOGLE_STATE_PARAM) !== intent.state) return null;
  return { code, redirectUri: googleRedirectUri() };
}

/** 연결을 한 번만 하도록 의도를 지우고, 인가 코드가 주소·방문 기록에 남지 않게 쿼리도 지운 뒤 연결 API를 부름. */
export async function completeGoogleLink(
  code: string,
  redirectUri: string,
): Promise<SocialLinkOutcome> {
  clearOAuthState(GOOGLE_LINK_INTENT_KEY);
  history.replaceState(null, "", window.location.pathname);
  const [error] = await tryit(linkSocial)("google", { code, redirectUri });
  if (!error) return { status: "linked" };
  return { status: "failed", reason: readFailureReason(error) };
}
