import { tryit } from "radash";

import { linkSocial, readFailureReason } from "@/entities/account";
import { navigateExternal } from "@/shared/lib";

import {
  KAKAO_CODE_PARAM,
  KAKAO_LINK_INTENT_KEY,
  KAKAO_STATE_PARAM,
} from "../model/constants";
import { buildKakaoAuthorizeUrl, kakaoRedirectUri } from "./kakao-authorize";
import { clearOAuthState, readOAuthState, saveOAuthState } from "./oauth-state";

import type { SocialLinkOutcome, SocialLinkRequest } from "@/entities/account";

/** 카카오 인가 화면으로 전체 이동하기 전에 연결 의도를 남김. 저장소를 못 쓰면 시작하지 않고 취소로 돌려줌. */
export function startKakaoLink(): Promise<SocialLinkRequest> {
  const state = saveOAuthState(KAKAO_LINK_INTENT_KEY);
  if (!state) return Promise.resolve({ status: "cancelled" });
  navigateExternal(buildKakaoAuthorizeUrl(state));
  return Promise.resolve({ status: "redirecting" });
}

/**
 * 돌아온 `/auth/kakao` 주소가 연결 흐름인지 읽음(부작용 없음). 쿼리의 `state`가 남겨 둔 의도와 같고 유효 시간 안일 때만
 * 인가 코드와 서버에 넘길 `redirectUri`를 돌려줌. 연결 의도가 없거나 `state`가 다른 복귀(로그인 흐름)는 로그인으로 처리됨.
 */
export function readKakaoLinkCallback(
  search: string = window.location.search,
): { code: string; redirectUri: string } | null {
  const intent = readOAuthState(KAKAO_LINK_INTENT_KEY);
  if (!intent) return null;
  const params = new URLSearchParams(search);
  const code = params.get(KAKAO_CODE_PARAM);
  if (!code || params.get(KAKAO_STATE_PARAM) !== intent.state) return null;
  return { code, redirectUri: kakaoRedirectUri() };
}

/** 연결을 한 번만 하도록 의도를 지우고, 인가 코드가 주소·방문 기록에 남지 않게 쿼리도 지운 뒤 연결 API를 부름. */
export async function completeKakaoLink(
  code: string,
  redirectUri: string,
): Promise<SocialLinkOutcome> {
  clearOAuthState(KAKAO_LINK_INTENT_KEY);
  history.replaceState(null, "", window.location.pathname);
  const [error] = await tryit(linkSocial)("kakao", { code, redirectUri });
  if (!error) return { status: "linked" };
  return { status: "failed", reason: readFailureReason(error) };
}
