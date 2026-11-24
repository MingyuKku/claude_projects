import { serverApiV3 } from "@/shared/api";

import { transformNotificationList } from "../lib/transform-notification";
import { notificationListSchema } from "../model/schema";

/** 시안에 더 보기·쪽 이동이 없어 첫 쪽만 읽음. */
const ENTRY_SIZE = 20;

/** `GET /v3/notifications`. 받은 알림 최신순과 전체 안 읽은 개수. */
export async function fetchNotifications() {
  const response = await serverApiV3.get("/notifications", {
    params: { page: 1, entrySize: ENTRY_SIZE },
  });
  return transformNotificationList(notificationListSchema.parse(response));
}

/** `POST /v3/notifications/{id}/read`. 이미 읽은 알림도 200이고 본문은 없음. */
export async function markNotificationRead(id: number): Promise<void> {
  await serverApiV3.post(`/notifications/${id}/read`);
}
