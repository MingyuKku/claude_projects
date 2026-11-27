import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";

import { applyNotificationRead } from "../lib/transform-notification";
import { fetchNotifications, markNotificationRead } from "./notification-api";

import type { NotificationList } from "../model/types";

export const NOTIFICATIONS_KEY = ["notifications"] as const;

/**
 * 알림 벨의 목록과 안 읽은 개수. 헤더가 한 번만 읽고, 창이 다시 활성화될 때도 읽음(폴링은 하지 않음).
 * 셸이 바뀌는 이동(현황 ↔ 등록 화면)마다 헤더가 새로 그려지므로, 캐시가 있으면 그때는 다시 읽지 않음.
 * 로그인하지 않았거나 알림을 받지 않는 계정(Sub ID)은 `isEnabled`를 false로 넘겨 요청하지 않음.
 */
export function useNotifications(isEnabled: boolean) {
  const { data, error, mutate } = useSWR(
    isEnabled ? NOTIFICATIONS_KEY : null,
    fetchNotifications,
    {
      revalidateOnFocus: true,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );
  return { data, isError: Boolean(error), mutate };
}

/** 푸시를 받았을 때처럼 밖에서 목록을 다시 읽을 때 씀. 목록을 읽고 있는 곳이 없으면 아무 일도 하지 않음. */
export function useRefreshNotifications() {
  const { mutate } = useSWRConfig();
  return useCallback(() => mutate(NOTIFICATIONS_KEY), [mutate]);
}

/**
 * 누르는 즉시 읽음으로 보이고, 요청이 실패하면 이전 값으로 되돌림. 끝나면 목록을 다시 읽어 개수를 맞추며
 * 없는 알림(404)도 같은 재조회로 정리됨. 실패는 던지지 않음(화면에 알리지 않는 동작).
 */
export function useMarkNotificationRead() {
  const { mutate } = useSWRConfig();

  return async function markRead(id: number) {
    try {
      await mutate<NotificationList | undefined>(
        NOTIFICATIONS_KEY,
        async (current) => {
          await markNotificationRead(id);
          return current && applyNotificationRead(current, id);
        },
        {
          optimisticData: (current) =>
            current && applyNotificationRead(current, id),
          rollbackOnError: true,
          populateCache: true,
          revalidate: true,
        },
      );
    } catch {
      // 롤백은 SWR이 처리함.
    }
  };
}
