import { MOCK_NOTIFICATION_CONSENT } from "../model/mock";

/** 알림 수신 동의 상태. 조회 API가 공개되기 전이라 목 데이터를 돌려줌(스펙 §7 B-3). */
export function useNotificationConsent() {
  return { consent: MOCK_NOTIFICATION_CONSENT, isLoading: false };
}
