import { CAMPAIGN_DRAFT_STEPS } from "./draft";

import type { CampaignDraftStep } from "./draft";

/**
 * 서버가 단계를 부르는 이름. 저장 요청 경로(`/campaign/{idx}/<이름>`)와 결제 검사의 `missingSteps`가 같은 이름을 씀.
 * 서버 값이라 프론트 단계 이름과 다른 것이 있음(`creator` ↔ `influencer`). 정책 동의는 저장 경로가 없음.
 */
export const SERVER_STEP_PATHS = {
  info: "info",
  product: "product",
  creator: "influencer",
  addOns: "add-ons",
  intro: "intro",
  conditions: "conditions",
} as const satisfies Partial<Record<CampaignDraftStep, string>>;

/** 서버 단계 이름을 초안 단계로 바꿈. 정책 동의(`policy`)는 결제 검사에서만 옴. 모르는 이름이면 null. */
export function toDraftStep(serverStep: string | null) {
  return (
    CAMPAIGN_DRAFT_STEPS.find(
      (step) =>
        (step === "policy" ? "policy" : SERVER_STEP_PATHS[step]) === serverStep,
    ) ?? null
  );
}
