import type { CampaignRegisterStep } from "@/entities/campaign";

// 결제를 유지한 채 재승인을 요청하므로 결제 금액에 영향을 주는 4단계와 이미 마친 7·8단계를 잠금.
export const REVISION_LOCK_NOTICE_KEYS = {
  "add-ons": "revision.lockedAmount",
  policy: "revision.lockedCompleted",
  payment: "revision.lockedCompleted",
} as const satisfies Partial<Record<CampaignRegisterStep, string>>;

export function isLockedInRevision(
  step: CampaignRegisterStep,
): step is keyof typeof REVISION_LOCK_NOTICE_KEYS {
  return step in REVISION_LOCK_NOTICE_KEYS;
}
