import { tryit } from "radash";

import { linkSocial, readFailureReason } from "@/entities/account";
import { navigateExternal } from "@/shared/lib";

import {
  NAVER_CODE_PARAM,
  NAVER_LINK_INTENT_KEY,
  NAVER_STATE_PARAM,
} from "../model/constants";
import { buildNaverAuthorizeUrl } from "./naver-authorize";
import { clearOAuthState, readOAuthState, saveOAuthState } from "./oauth-state";

import type { SocialLinkOutcome, SocialLinkRequest } from "@/entities/account";

// 네이버는 인가 코드를 `/auth/naver` 쿼리로 돌려주고 서버가 교환함. 연결 의도(`state`)가 같을 때만 로그인 대신 연결을 이어 감.

/** 네이버 인가 화면으로 전체 이동하기 전에 연결 의도를 남김. 저장소를 못 쓰면 시작하지 않고 취소로 돌려줌. */
export function startNaverLink(): Promise<SocialLinkRequest> {
  const state = saveOAuthState(NAVER_LINK_INTENT_KEY);
  if (!state) return Promise.resolve({ status: "cancelled" });
  navigateExternal(buildNaverAuthorizeUrl(state));
  return Promise.resolve({ status: "redirecting" });
}

/**
 * 돌아온 `/auth/naver` 주소가 연결 흐름인지 읽음(부작용 없음). 쿼리의 `state`가 남겨 둔 의도와 같고 유효 시간 안일 때만
 * 인가 코드와 서버에 넘길 `state`를 돌려줌.
 */
export function readNaverLinkCallback(
  search: string = window.location.search,
): { code: string; state: string } | null {
  const intent = readOAuthState(NAVER_LINK_INTENT_KEY);
  if (!intent) return null;
  const params = new URLSearchParams(search);
  const code = params.get(NAVER_CODE_PARAM);
  if (!code || params.get(NAVER_STATE_PARAM) !== intent.state) return null;
  return { code, state: intent.state };
}

/** 연결을 한 번만 하도록 의도를 지우고, 인가 코드가 주소·방문 기록에 남지 않게 쿼리도 지운 뒤 연결 API를 부름. */
export async function completeNaverLink(
  code: string,
  state: string,
): Promise<SocialLinkOutcome> {
  clearOAuthState(NAVER_LINK_INTENT_KEY);
  history.replaceState(null, "", window.location.pathname);
  const [error] = await tryit(linkSocial)("naver", { code, state });
  if (!error) return { status: "linked" };
  return { status: "failed", reason: readFailureReason(error) };
}
