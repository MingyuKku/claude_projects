import { serverApiV3 } from "./clients";

const PUSH_TOKEN_KEY = "bigbird.pushToken";

/** 등록한 FCM 토큰을 기억함. 로그아웃에서 FCM과 통신하지 않고도 이 기기를 끄기 위해서임. */
export function saveWebPushToken(token: string): void {
  try {
    localStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch {
    // 저장소를 못 쓰면 로그아웃에서 끌 토큰을 알 수 없을 뿐, 등록 자체는 영향이 없음.
  }
}

function readWebPushToken(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * 이 기기의 푸시를 서버에서 끔(로그아웃 요청 전에 불러야 함, 세션이 필요함). 토큰은 지우지 않아
 * 다음 로그인에서 같은 토큰을 다시 등록하면 켜짐. 실패해도 로그아웃은 이어서 해야 하므로 오류를 던지지 않고 로그만 남김.
 */
export async function unregisterWebPushDevice(): Promise<void> {
  const token = readWebPushToken();
  if (!token) return;
  try {
    await serverApiV3.delete("/notifications/devices", { params: { token } });
  } catch (error) {
    console.error("웹푸시 기기 끄기 실패", error);
  }
}
