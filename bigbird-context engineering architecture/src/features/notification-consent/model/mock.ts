import type { NotificationConsentViewModel } from "./types";

// 알림 동의 조회·변경 API가 공개되기 전 목(스펙 §7 B-3). API가 나오면 이 파일과 훅의 목 분기를 지움. 값은 시안 상태.
export const MOCK_NOTIFICATION_CONSENT: NotificationConsentViewModel = {
  alimtalk: { marketing: true, night: false },
  push: { marketing: true, night: false },
};
