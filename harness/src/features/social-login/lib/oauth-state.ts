import { OAUTH_STATE_TTL_MS } from "../model/constants";

// 공급자 로그인은 전체 화면 이동이라 결과가 돌아오는 화면(`/auth/{platform}`)이 "무엇을 하려고 시작했는지"를 알아야 함.
// 그래서 시작할 때 임의 값(`state`)과 시각을 `sessionStorage`에 두고, 돌아온 `state`가 같을 때만 그 의도(연결 또는 로그인)로 처리함.
// 요청 위조(공격자의 공급자 계정이나 인가 코드를 끼워 넣는 것)를 막으려는 것이며, 의도마다 저장 키를 따로 두어
// 남아 있는 연결 의도가 로그인을, 로그인 의도가 연결을 가로채지 못함.

export interface OAuthState {
  state: string;
  createdAt: number;
}

/** 요청 위조 방지용 임의 `state` 값. 페이지가 바뀌지 않는 팝업 흐름(애플)은 저장 없이 이 값만 만들어 비교함. */
export function createState() {
  // 보안 컨텍스트가 아닌 개발 주소(http 사설 IP)에서는 `randomUUID`가 없어 `getRandomValues`를 씀.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** 연결 의도를 남기고 그 `state`를 돌려줌. 저장소를 못 쓰면 null(연결을 시작하지 않아야 함). */
export function saveOAuthState(key: string): string | null {
  const intent: OAuthState = { state: createState(), createdAt: Date.now() };
  try {
    sessionStorage.setItem(key, JSON.stringify(intent));
  } catch {
    return null;
  }
  return intent.state;
}

/** 남겨 둔 의도를 읽음(부작용 없음). 없거나 형태가 다르거나 유효 시간(10분)이 지났으면 null. */
export function readOAuthState(key: string): OAuthState | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const intent = JSON.parse(raw) as Partial<OAuthState>;
    if (
      typeof intent.state !== "string" ||
      typeof intent.createdAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - intent.createdAt > OAUTH_STATE_TTL_MS) return null;
    return { state: intent.state, createdAt: intent.createdAt };
  } catch {
    return null;
  }
}

export function clearOAuthState(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // 저장소를 못 쓰는 환경이면 지울 것도 없음.
  }
}
