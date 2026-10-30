import { z } from "zod";

/** `GET`·`PUT /v3/mypage/account/agreement`(Swagger `AccountAgreementV3Response`). 최초 조회면 서버가 4개 모두 true로 만들어 줌. */
export const notificationConsentSchema = z.object({
  alimAdInfoAgree: z.boolean(),
  alimNightAgree: z.boolean(),
  pushAdInfoAgree: z.boolean(),
  pushNightAgree: z.boolean(),
});

export type NotificationConsent = z.infer<typeof notificationConsentSchema>;
