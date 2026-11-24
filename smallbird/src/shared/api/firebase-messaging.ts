import { ENV, isWebPushConfigured } from "@/shared/config";

import { getFirebaseApp } from "./firebase";

const PUSH_APP_NAME = "push";

export type WebPushPermission = NotificationPermission | "unsupported";

/**
 * SDK를 불러오기 전에 브라우저 기능과 설정값만 확인함. 헤더가 모든 화면에 있으므로
 * 대부분의 사용자는 여기서 걸러져 Firebase SDK를 받지 않음.
 */
export function getWebPushPermission(): WebPushPermission {
  if (
    !isWebPushConfigured() ||
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * 알림 권한 창을 띄워 권한을 요청함. 아직 묻지 않은 상태(`default`)일 때만 묻고, 이미 정해졌거나 지원하지 않는
 * 환경이면 묻지 않고 현재 상태를 돌려줌. Safari(iOS 홈 화면 웹앱 포함)는 클릭 같은 직접 동작에 대한 응답으로만
 * 권한을 요청하게 하므로, 클릭 핸들러 안에서 다른 `await`보다 먼저 불러야 함.
 */
export async function requestWebPushPermission(): Promise<WebPushPermission> {
  if (getWebPushPermission() !== "default") return getWebPushPermission();
  await Notification.requestPermission();
  return getWebPushPermission();
}

/**
 * 이 브라우저의 FCM 토큰. 권한이 이미 허용된 경우에만 발급하며 권한 창은 띄우지 않음.
 * 지원하지 않는 환경이면 null. Service Worker는 SDK가 루트의 `firebase-messaging-sw.js`로 등록함.
 */
export async function getWebPushToken(): Promise<string | null> {
  if (getWebPushPermission() !== "granted") return null;
  const [app, { getMessaging, getToken, isSupported }] = await Promise.all([
    getFirebaseApp(PUSH_APP_NAME, {
      apiKey: ENV.firebaseApiKey,
      authDomain: ENV.firebaseAuthDomain,
      projectId: ENV.firebaseProjectId,
      appId: ENV.firebasePushAppId || ENV.firebaseAppId,
      messagingSenderId: ENV.firebaseMessagingSenderId,
    }),
    import("firebase/messaging"),
  ]);
  if (!(await isSupported())) return null;
  const token = await getToken(getMessaging(app), {
    vapidKey: ENV.firebaseVapidKey,
  });
  return token || null;
}
