export type NotificationKind = "approved" | "rejected";

export interface NotificationItem {
  id: number;
  kind: NotificationKind;
  /** 알림을 만든 시점의 캠페인명. 없을 수 있음. */
  campaignName: string | null;
  date: string;
  time: string;
  isRead: boolean;
}

export interface NotificationList {
  items: NotificationItem[];
  /** 쪽과 관계없는 전체 안 읽은 개수. */
  unreadCount: number;
}
