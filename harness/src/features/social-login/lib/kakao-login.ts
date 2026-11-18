import { navigateExternal } from "@/shared/lib";

import {
  KAKAO_CODE_PARAM,
  KAKAO_LOGIN_INTENT_KEY,
  KAKAO_STATE_PARAM,
} from "../model/constants";
import { buildKakaoAuthorizeUrl, kakaoRedirectUri } from "./kakao-authorize";
import { clearOAuthState, readOAuthState, saveOAuthState } from "./oauth-state";

/** 카카오 인가 화면으로 전체 이동하기 전에 로그인 의도(`state`)를 남김. 저장소를 못 쓰면 시작하지 않고 오류를 던짐(화면이 실패 안내를 보임). */
export function startKakaoLogin(): Promise<void> {
  const state = saveOAuthState(KAKAO_LOGIN_INTENT_KEY);
  if (!state)
    return Promise.reject(new Error("sessionStorage 를 쓸 수 없습니다"));
  navigateExternal(buildKakaoAuthorizeUrl(state));
  return Promise.resolve();
}

/**
 * 돌아온 `/auth/kakao` 주소가 우리가 시작한 로그인인지 읽고 의도를 한 번만 쓰게 지움. 쿼리의 `state`가 남겨 둔 값과 같고
 * 유효 시간 안일 때만 인가 코드와 서버에 넘길 `redirectUri`를 돌려줌(아니면 null: 요청 위조·만료·동의 거부).
 */
export function takeKakaoLoginCallback(
  search: string,
): { code: string; redirectUri: string } | null {
  const intent = readOAuthState(KAKAO_LOGIN_INTENT_KEY);
  clearOAuthState(KAKAO_LOGIN_INTENT_KEY);
  if (!intent) return null;
  const params = new URLSearchParams(search);
  const code = params.get(KAKAO_CODE_PARAM);
  if (!code || params.get(KAKAO_STATE_PARAM) !== intent.state) return null;
  return { code, redirectUri: kakaoRedirectUri() };
}
