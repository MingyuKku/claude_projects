import { ENV, ROUTES } from "@/shared/config";

import { GOOGLE_SCOPE } from "../model/constants";
import { loadGoogleScript } from "./load-script";
import "../model/sdk-types";

// SDK는 클릭할 때 불러옴. 화면에 들어올 때 넷 다 불러오면 대부분의 사용자가
// 쓰지 않는 스크립트 때문에 첫 렌더가 느려짐.

/** 구글이 인가 코드를 돌려줄 주소. 콘솔에 등록된 값이고, 연결도 같은 값을 `redirectUri`로 서버에 넘김. */
export function googleRedirectUri() {
  return `${ENV.oauthRedirectUrl}${ROUTES.authGoogle}`;
}

/**
 * 구글은 리다이렉트로 인가 코드를 돌려주고, 서버가 이를 교환함.
 * 로그인·연결 모두 `state`를 실어 보내 돌아온 값과 비교함.
 */
export async function requestGoogleCode(state: string): Promise<void> {
  await loadGoogleScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("구글 SDK 가 없습니다");
  oauth2
    .initCodeClient({
      client_id: ENV.googleClientId,
      scope: GOOGLE_SCOPE,
      ux_mode: "redirect",
      redirect_uri: googleRedirectUri(),
      state,
    })
    .requestCode();
}
