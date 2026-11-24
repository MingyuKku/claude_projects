import { useEffect } from "react";
import { useNavigate } from "react-router";

import { readPushClickLink } from "../lib/push-click-message";

/** 푸시 알림을 눌렀을 때 Service Worker가 보낸 메시지를 받아 앱 안에서 해당 화면으로 이동함. */
export function usePushClickNavigation(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function handleMessage(event: MessageEvent) {
      const link = readPushClickLink(event.data);
      if (link) void navigate(link);
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [navigate]);
}
