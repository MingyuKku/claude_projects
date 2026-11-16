import type { NotificationConsent } from "./schema";
import type { NotificationChannel, NotificationConsentKind } from "./types";

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  "alimtalk",
  "push",
];
export const NOTIFICATION_CONSENT_KINDS: readonly NotificationConsentKind[] = [
  "marketing",
  "night",
];

/** 화면의 채널·종류 → 서버 필드. */
export const NOTIFICATION_CONSENT_FIELDS: Record<
  NotificationChannel,
  Record<NotificationConsentKind, keyof NotificationConsent>
> = {
  alimtalk: { marketing: "alimAdInfoAgree", night: "alimNightAgree" },
  push: { marketing: "pushAdInfoAgree", night: "pushNightAgree" },
};
