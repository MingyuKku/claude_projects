import { NOTIFICATION_CONSENT_FIELDS } from "../model/constants";

import type { NotificationConsent } from "../model/schema";
import type {
  NotificationConsentChange,
  NotificationConsentViewModel,
} from "../model/types";

export function transformNotificationConsentToViewModel(
  response: NotificationConsent,
): NotificationConsentViewModel {
  return {
    alimtalk: {
      marketing: response.alimAdInfoAgree,
      night: response.alimNightAgree,
    },
    push: {
      marketing: response.pushAdInfoAgree,
      night: response.pushNightAgree,
    },
  };
}

/** 바꾼 스위치 하나만 보냄. 서버는 보내지 않은 필드를 그대로 둠(부분 수정). */
export function toNotificationConsentBody({
  channel,
  kind,
  isAgreed,
}: NotificationConsentChange): Partial<NotificationConsent> {
  return { [NOTIFICATION_CONSENT_FIELDS[channel][kind]]: isAgreed };
}

/** 낙관적 반영용. 바꾼 스위치 하나만 새 값으로 둠. */
export function applyNotificationConsentChange(
  consent: NotificationConsentViewModel,
  { channel, kind, isAgreed }: NotificationConsentChange,
): NotificationConsentViewModel {
  return { ...consent, [channel]: { ...consent[channel], [kind]: isAgreed } };
}
