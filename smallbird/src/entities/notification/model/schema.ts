import { z } from "zod";

/**
 * `GET /v3/notifications` 응답. `type`은 서버가 종류를 늘릴 수 있어 문자열로 받고,
 * 아는 종류만 트랜스포머가 뷰모델로 바꿈.
 */
export const notificationListSchema = z.object({
  list: z.array(
    z.object({
      notificationIdx: z.number(),
      type: z.string(),
      campaignIdx: z.number().nullable(),
      campaignCode: z.string().nullable(),
      campaignName: z.string().nullable(),
      /** KST `yyyy-MM-dd HH:mm:ss` */
      createdAt: z.string(),
      isRead: z.boolean(),
    }),
  ),
  unreadCount: z.number(),
});

export type NotificationListResponse = z.infer<typeof notificationListSchema>;
