import type { CampaignRegisterStep } from "@/entities/campaign";

// 결제를 유지한 채 재승인을 요청하므로 결제 금액에 영향을 주는 부가서비스와 이미 마친 결제를 잠금. 정책 동의는 반려하면
// 서버가 동의 기록을 지워 재승인 요청 때 다시 받으므로 열어 둠.
export const REVISION_LOCK_NOTICE_KEYS = {
  "add-ons": "revision.lockedAmount",
  payment: "revision.lockedCompleted",
} as const satisfies Partial<Record<CampaignRegisterStep, string>>;

export function isLockedInRevision(
  step: CampaignRegisterStep,
): step is keyof typeof REVISION_LOCK_NOTICE_KEYS {
  return step in REVISION_LOCK_NOTICE_KEYS;
}
