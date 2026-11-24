import { tryit } from "radash";

import { getWebPushPermission, requestWebPushPermission } from "@/shared/api";

import { registerThisDevice } from "./register-this-device";

/**
 * 승인 요청처럼 결과를 기다리는 순간에 브라우저 알림 권한을 묻고, 허용하면 이 기기를 바로 등록함.
 * 아직 묻지 않은 브라우저(`default`)에서만 권한 창을 띄우며, 이미 허용·차단했거나 지원하지 않으면 아무것도 하지 않음.
 * 사용자의 클릭 핸들러 안에서 불러야 함(권한 창은 직접 동작에 대한 응답으로만 뜸). 실패해도 화면에 알리지 않음.
 */
export async function requestPushPermissionAndRegister(): Promise<void> {
  if (getWebPushPermission() !== "default") return;
  const [error, permission] = await tryit(requestWebPushPermission)();
  if (error) {
    console.error("웹푸시 권한 요청 실패", error);
    return;
  }
  if (permission === "granted") await registerThisDevice();
}
