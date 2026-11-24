import { serverApiV3 } from "@/shared/api";

const WEB_PLATFORM = "WEB";

/** 이 브라우저의 FCM 토큰을 로그인한 사용자의 기기로 등록함. 같은 토큰을 반복해 등록해도 되고 응답 본문은 없음. */
export async function registerWebPushDevice(
  token: string,
  deviceName: string,
): Promise<void> {
  await serverApiV3.post("/notifications/devices", {
    token,
    platform: WEB_PLATFORM,
    deviceName,
  });
}
