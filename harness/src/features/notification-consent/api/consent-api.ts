import { serverApiV3 } from "@/shared/api";

import {
  toNotificationConsentBody,
  transformNotificationConsentToViewModel,
} from "../lib/transform-notification-consent";
import { notificationConsentSchema } from "../model/schema";

import type { NotificationConsentChange } from "../model/types";

const AGREEMENT_PATH = "/mypage/account/agreement";

export async function fetchNotificationConsent() {
  const response = await serverApiV3.get(AGREEMENT_PATH);
  return transformNotificationConsentToViewModel(
    notificationConsentSchema.parse(response),
  );
}

/** 응답이 바뀐 뒤의 전체 상태라 그대로 캐시로 씀. */
export async function updateNotificationConsent(
  change: NotificationConsentChange,
) {
  const response = await serverApiV3.put(
    AGREEMENT_PATH,
    toNotificationConsentBody(change),
  );
  return transformNotificationConsentToViewModel(
    notificationConsentSchema.parse(response),
  );
}
