import { isStepComplete } from "../model/step-definitions";

import type { CampaignStepModel } from "../model/step-definitions";
import type { StepSlug } from "../model/steps";
import type { CampaignDraft } from "@/entities/campaign";

export type StepIndicatorState = "current" | "done" | "visited" | "unvisited";

export interface StepIndicator {
  slug: StepSlug;
  state: StepIndicatorState;
  /** 건너뛰었거나 가 봤는데 필수 입력이 비어 있음(느낌표 + 빨간 테두리). */
  hasAlert: boolean;
}

/**
 * 사이드바의 단계별 표시. 저장된 값이 아니라 초안 값을 단계 스키마로 매번 검사해 정하고, 서버에는 가 본 단계(`visitedSteps`)만 남음.
 * - 현재 단계: 포커스 링. 아직 채우는 중이라 경고하지 않음.
 * - 완료: 가 본 적이 있고 입력 조건을 통과함(체크).
 * - 지나친 단계: 가 봤거나, 가 본 가장 뒤 단계보다 앞이라 건너뛴 단계. 필수 입력이 비어 있으면 경고. 선택 단계(부가서비스·결제)는 경고하지 않음.
 * - 아직 안 간 단계: 가 본 가장 뒤 단계보다 뒤라 흐림.
 */
export function getStepIndicators(
  steps: CampaignStepModel[],
  draft: CampaignDraft,
  currentSlug: StepSlug,
): StepIndicator[] {
  const visited = new Set(draft.visitedSteps);
  const currentIndex = steps.findIndex((step) => step.slug === currentSlug);
  const lastVisitedIndex = steps.reduce(
    (last, step, index) => (visited.has(step.section) ? index : last),
    currentIndex,
  );

  return steps.map((step, index) => {
    if (step.slug === currentSlug) {
      return { slug: step.slug, state: "current", hasAlert: false };
    }
    const isVisited = visited.has(step.section);
    const isPassed = isVisited || index < lastVisitedIndex;
    if (!isPassed) {
      return { slug: step.slug, state: "unvisited", hasAlert: false };
    }
    const isComplete = isStepComplete(step, draft);
    if (isVisited && isComplete) {
      return { slug: step.slug, state: "done", hasAlert: false };
    }
    return {
      slug: step.slug,
      state: "visited",
      hasAlert: !step.isOptional && !isComplete,
    };
  });
}
