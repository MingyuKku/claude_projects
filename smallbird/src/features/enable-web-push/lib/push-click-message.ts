/** Service Worker가 알림 클릭을 앱 창에 알리는 메시지 종류(`public/firebase-messaging-sw.js`와 같은 값). */
export const PUSH_CLICK_MESSAGE_TYPE = "web-push-click";

/** Service Worker가 새 푸시가 왔다고 앱 창에 알리는 메시지 종류. */
export const PUSH_RECEIVED_MESSAGE_TYPE = "web-push-received";

/** 새 푸시 도착 메시지인지. */
export function isPushReceivedMessage(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === PUSH_RECEIVED_MESSAGE_TYPE
  );
}

/** 알림 클릭 메시지에서 앱 안 이동 경로를 꺼냄. 같은 출처의 경로(`/`로 시작)가 아니면 null. */
export function readPushClickLink(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const { type, link } = data as { type?: unknown; link?: unknown };
  if (type !== PUSH_CLICK_MESSAGE_TYPE || typeof link !== "string") return null;
  const isAppPath =
    link.startsWith("/") && !link.startsWith("//") && !link.includes("\\");
  return isAppPath ? link : null;
}
