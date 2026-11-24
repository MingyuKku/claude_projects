import { tryit } from "radash";

import { getWebPushToken, saveWebPushToken } from "@/shared/api";

import { registerWebPushDevice } from "../api/device-api";
import { getDeviceName } from "../lib/device-name";

/**
 * 권한이 이미 허용된 브라우저의 토큰을 받아 서버에 등록함. 등록했으면 true. 권한이 없거나 지원하지 않으면
 * 아무것도 하지 않고 false, 실패해도 화면에 알리지 않음(다음 화면 진입에서 다시 시도).
 */
export async function registerThisDevice(): Promise<boolean> {
  const [tokenError, token] = await tryit(getWebPushToken)();
  if (tokenError) {
    console.error("웹푸시 토큰 발급 실패", tokenError);
    return false;
  }
  if (!token) return false;

  const [registerError] = await tryit(registerWebPushDevice)(
    token,
    getDeviceName(),
  );
  if (registerError) {
    console.error("웹푸시 기기 등록 실패", registerError);
    return false;
  }
  saveWebPushToken(token);
  return true;
}
