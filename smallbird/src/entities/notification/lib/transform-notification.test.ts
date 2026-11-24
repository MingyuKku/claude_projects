import {
  applyNotificationRead,
  transformNotificationList,
} from "./transform-notification";

import type { NotificationListResponse } from "../model/schema";

function entry(
  overrides: Partial<NotificationListResponse["list"][number]> = {},
): NotificationListResponse["list"][number] {
  return {
    notificationIdx: 1,
    type: "CAMPAIGN_APPROVED",
    campaignIdx: 10,
    campaignCode: "C-10",
    campaignName: "뷰티 체험단",
    createdAt: "2027-12-12 09:05:30",
    isRead: false,
    ...overrides,
  };
}

describe("transformNotificationList", () => {
  it("승인·반려 코드를 종류로 바꾸고 시각은 시간대 변환 없이 날짜·시각으로 나눈다", () => {
    const result = transformNotificationList({
      list: [entry(), entry({ notificationIdx: 2, type: "CAMPAIGN_REJECTED" })],
      unreadCount: 7,
    });

    expect(result.unreadCount).toBe(7);
    expect(result.items.map((item) => item.kind)).toEqual([
      "approved",
      "rejected",
    ]);
    expect(result.items[0]).toMatchObject({
      id: 1,
      campaignName: "뷰티 체험단",
      date: "2027.12.12",
      time: "09:05",
      isRead: false,
    });
  });

  it("모르는 종류와 형식이 다른 시각은 목록에서 뺀다", () => {
    const result = transformNotificationList({
      list: [
        entry({ type: "SOMETHING_NEW" }),
        entry({ notificationIdx: 2, createdAt: "어제" }),
        entry({ notificationIdx: 3 }),
      ],
      unreadCount: 3,
    });

    expect(result.items.map((item) => item.id)).toEqual([3]);
  });
});

describe("applyNotificationRead", () => {
  const current = transformNotificationList({
    list: [entry(), entry({ notificationIdx: 2, isRead: true })],
    unreadCount: 1,
  });

  it("안 읽은 알림을 읽음으로 바꾸고 개수를 하나 줄인다", () => {
    const result = applyNotificationRead(current, 1);

    expect(result.items[0]?.isRead).toBe(true);
    expect(result.unreadCount).toBe(0);
  });

  it("이미 읽은 알림이나 없는 알림이면 그대로 둔다", () => {
    expect(applyNotificationRead(current, 2)).toBe(current);
    expect(applyNotificationRead(current, 99)).toBe(current);
  });
});
