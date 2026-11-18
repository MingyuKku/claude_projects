import { navigateExternal } from "@/shared/lib";

import {
  NAVER_CODE_PARAM,
  NAVER_LOGIN_INTENT_KEY,
  NAVER_STATE_PARAM,
} from "../model/constants";
import { buildNaverAuthorizeUrl } from "./naver-authorize";
import { clearOAuthState, readOAuthState, saveOAuthState } from "./oauth-state";

/** 네이버 인가 화면으로 전체 이동하기 전에 로그인 의도(`state`)를 남김. 저장소를 못 쓰면 시작하지 않고 오류를 던짐(화면이 실패 안내를 보임). */
export function startNaverLogin(): Promise<void> {
  const state = saveOAuthState(NAVER_LOGIN_INTENT_KEY);
  if (!state)
    return Promise.reject(new Error("sessionStorage 를 쓸 수 없습니다"));
  navigateExternal(buildNaverAuthorizeUrl(state));
  return Promise.resolve();
}

/**
 * 돌아온 `/auth/naver` 주소가 우리가 시작한 로그인인지 읽고 의도를 한 번만 쓰게 지움. 쿼리의 `state`가 남겨 둔 값과 같고
 * 유효 시간 안일 때만 인가 코드와 서버에 넘길 `state`를 돌려줌(아니면 null: 요청 위조·만료·동의 거부).
 */
export function takeNaverLoginCallback(
  search: string,
): { code: string; state: string } | null {
  const intent = readOAuthState(NAVER_LOGIN_INTENT_KEY);
  clearOAuthState(NAVER_LOGIN_INTENT_KEY);
  if (!intent) return null;
  const params = new URLSearchParams(search);
  const code = params.get(NAVER_CODE_PARAM);
  if (!code || params.get(NAVER_STATE_PARAM) !== intent.state) return null;
  return { code, state: intent.state };
}
