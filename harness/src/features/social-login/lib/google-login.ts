import { tryit } from "radash";

import {
  GOOGLE_CODE_PARAM,
  GOOGLE_LOGIN_INTENT_KEY,
  GOOGLE_STATE_PARAM,
} from "../model/constants";
import { clearOAuthState, readOAuthState, saveOAuthState } from "./oauth-state";
import { googleRedirectUri, requestGoogleCode } from "./start-login";

/** 구글 인가 화면으로 전체 이동하기 전에 로그인 의도(`state`)를 남김. 저장소나 SDK를 못 쓰면 시작하지 않고 오류를 던짐(화면이 실패 안내를 보임). */
export async function startGoogleLogin(): Promise<void> {
  const state = saveOAuthState(GOOGLE_LOGIN_INTENT_KEY);
  if (!state) throw new Error("sessionStorage 를 쓸 수 없습니다");
  const [error] = await tryit(requestGoogleCode)(state);
  if (error) {
    // 이동하지 못했으면 남은 의도가 다음 복귀에 영향을 주지 않게 지움.
    clearOAuthState(GOOGLE_LOGIN_INTENT_KEY);
    throw error;
  }
}

/**
 * 돌아온 `/auth/google` 주소가 우리가 시작한 로그인인지 읽고 의도를 한 번만 쓰게 지움. 쿼리의 `state`가 남겨 둔 값과 같고
 * 유효 시간 안일 때만 인가 코드와 서버에 넘길 `redirectUri`를 돌려줌(아니면 null: 요청 위조·만료·동의 거부).
 */
export function takeGoogleLoginCallback(
  search: string,
): { code: string; redirectUri: string } | null {
  const intent = readOAuthState(GOOGLE_LOGIN_INTENT_KEY);
  clearOAuthState(GOOGLE_LOGIN_INTENT_KEY);
  if (!intent) return null;
  const params = new URLSearchParams(search);
  const code = params.get(GOOGLE_CODE_PARAM);
  if (!code || params.get(GOOGLE_STATE_PARAM) !== intent.state) return null;
  return { code, redirectUri: googleRedirectUri() };
}
