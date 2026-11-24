import { formatNumericDate } from "@/shared/i18n";

import type { NotificationListResponse } from "../model/schema";
import type {
  NotificationItem,
  NotificationKind,
  NotificationList,
} from "../model/types";

const KIND_BY_TYPE: Record<string, NotificationKind> = {
  CAMPAIGN_APPROVED: "approved",
  CAMPAIGN_REJECTED: "rejected",
};

const CREATED_AT_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/;

/** 서버 시각은 KST 문자열이라 시간대 변환 없이 쓰고, 날짜 표기만 현재 언어를 따름. 형식이 다르면 null. */
function formatCreatedAt(createdAt: string) {
  const match = CREATED_AT_PATTERN.exec(createdAt);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return {
    date: formatNumericDate(
      new Date(Number(year), Number(month) - 1, Number(day)),
    ),
    time: `${hour}:${minute}`,
  };
}

/** 모르는 종류나 시각 형식은 건너뜀(서버가 종류를 늘려도 화면이 깨지지 않게). */
export function transformNotificationList(
  response: NotificationListResponse,
): NotificationList {
  const items = response.list.flatMap((entry): NotificationItem[] => {
    const kind = KIND_BY_TYPE[entry.type];
    const createdAt = formatCreatedAt(entry.createdAt);
    if (!kind || !createdAt) return [];
    return [
      {
        id: entry.notificationIdx,
        kind,
        campaignName: entry.campaignName,
        ...createdAt,
        isRead: entry.isRead,
      },
    ];
  });
  return { items, unreadCount: response.unreadCount };
}

/** 읽음 처리를 화면에 먼저 반영함. 이미 읽은 알림이면 개수를 줄이지 않음. */
export function applyNotificationRead(
  current: NotificationList,
  id: number,
): NotificationList {
  const target = current.items.find((item) => item.id === id);
  if (!target || target.isRead) return current;
  return {
    items: current.items.map((item) =>
      item.id === id ? { ...item, isRead: true } : item,
    ),
    unreadCount: Math.max(0, current.unreadCount - 1),
  };
}
