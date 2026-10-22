import type { NotificationChannel, NotificationConsentKind } from "./types";

// 시안 순서: 알림톡 → 푸시, 각각 광고성 → 야간.
export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  "alimtalk",
  "push",
];
export const NOTIFICATION_CONSENT_KINDS: readonly NotificationConsentKind[] = [
  "marketing",
  "night",
];
