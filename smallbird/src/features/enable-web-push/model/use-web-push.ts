import { useRefreshNotifications } from "@/entities/notification";

import { usePushClickNavigation } from "./use-push-click-navigation";
import { usePushMessageRefresh } from "./use-push-message-refresh";
import { usePushRegistration } from "./use-push-registration";

import type { SessionViewModel } from "@/entities/session";

/**
 * 웹푸시 연결: 로그인한 사용자의 기기 등록, 푸시를 받았을 때 알림 목록 다시 읽기, 알림 클릭 이동. 셸에서 한 번 호출함.
 * Sub ID는 알림을 받지 않고 기기 API가 403이라 등록하지 않음.
 */
export function useWebPush(
  session: Pick<SessionViewModel, "userIdx" | "authority"> | null,
): void {
  const canReceive = session !== null && session.authority !== "SUB";
  const refreshNotifications = useRefreshNotifications();
  usePushRegistration(canReceive ? session.userIdx : undefined);
  usePushMessageRefresh(canReceive, refreshNotifications);
  usePushClickNavigation();
}
