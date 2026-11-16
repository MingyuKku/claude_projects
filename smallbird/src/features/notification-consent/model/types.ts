export type NotificationChannel = "alimtalk" | "push";
export type NotificationConsentKind = "marketing" | "night";

/** 채널별 수신 동의 여부. 광고성과 야간은 서로 독립. */
export type NotificationConsentViewModel = Record<
  NotificationChannel,
  Record<NotificationConsentKind, boolean>
>;

/** 스위치 하나의 변경. */
export interface NotificationConsentChange {
  channel: NotificationChannel;
  kind: NotificationConsentKind;
  isAgreed: boolean;
}
