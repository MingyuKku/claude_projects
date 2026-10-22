export type NotificationChannel = "alimtalk" | "push";
export type NotificationConsentKind = "marketing" | "night";

/** 채널별 수신 동의 여부. 광고성과 야간은 서로 독립(v2와 같음). */
export type NotificationConsentViewModel = Record<
  NotificationChannel,
  Record<NotificationConsentKind, boolean>
>;
