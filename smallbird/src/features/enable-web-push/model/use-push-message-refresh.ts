import { useEffect } from "react";

import { isPushReceivedMessage } from "../lib/push-click-message";

/**
 * 푸시가 오면 `onNewNotification`을 부름. 푸시는 새 알림이 왔다는 신호일 뿐이라 내용을 쓰지 않고 호출한 쪽이
 * 목록을 다시 읽음. Service Worker가 앱 창에 메시지로 알려 주며(Firebase SDK의 `onMessage`는 SDK의
 * Service Worker 메시지만 받아서 쓰지 못함), `isEnabled`가 false면 받지 않음.
 */
export function usePushMessageRefresh(
  isEnabled: boolean,
  onNewNotification: () => void,
): void {
  useEffect(() => {
    if (!isEnabled || !("serviceWorker" in navigator)) return;

    function handleMessage(event: MessageEvent) {
      if (isPushReceivedMessage(event.data)) onNewNotification();
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [isEnabled, onNewNotification]);
}
