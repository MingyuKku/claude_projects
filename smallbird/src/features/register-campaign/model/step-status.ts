import { isStepComplete, isStepStarted } from "./step-completion";

import type { RegisterStepDefinition } from "./steps";
import type { CampaignDraft, CampaignRegisterStep } from "@/entities/campaign";

// 사이드바 단계 상태(스펙 §3 단계 사이드바). 1단계를 통과하기 전에는 2~8단계를 막고, 필수 미입력 경고는
// 현재 단계와 그 이전 단계 중 필수값이 빠진 단계에 붙임. 현재 단계는 일부라도 입력했을 때만 붙여, 막 연 빈 단계가 오류처럼 보이지 않게 함.

export type StepState = "default" | "current" | "disabled";

export interface StepStatus {
  step: CampaignRegisterStep;
  state: StepState;
  hasWarning: boolean;
}

export function isInfoComplete(draft: CampaignDraft) {
  return isStepComplete("info", draft);
}

function hasWarning(
  definition: RegisterStepDefinition,
  draft: CampaignDraft,
  isCurrent: boolean,
  isReached: boolean,
): boolean {
  const { draftStep, isOptional } = definition;
  if (!isReached || draftStep === null || isOptional) return false;
  if (isStepComplete(draftStep, draft)) return false;
  return !isCurrent || isStepStarted(draftStep, draft);
}

export function getStepStatuses({
  steps,
  draft,
  currentStep,
}: {
  steps: readonly RegisterStepDefinition[];
  draft: CampaignDraft;
  currentStep: CampaignRegisterStep;
}): StepStatus[] {
  const isUnlocked = isInfoComplete(draft);
  const currentIndex = steps.findIndex(({ step }) => step === currentStep);
  return steps.map((definition, index) => {
    const isCurrent = definition.step === currentStep;
    const isLocked = !isUnlocked && definition.draftStep !== "info";
    let state: StepState = "default";
    if (isCurrent) state = "current";
    else if (isLocked) state = "disabled";
    return {
      step: definition.step,
      state,
      hasWarning: hasWarning(
        definition,
        draft,
        isCurrent,
        index <= currentIndex,
      ),
    };
  });
}

/** 아직 끝내지 않은 첫 필수 단계. 모두 끝났으면 결제. */
export function getFirstIncompleteStep(
  steps: readonly RegisterStepDefinition[],
  draft: CampaignDraft,
): CampaignRegisterStep {
  const incomplete = steps.find(
    ({ draftStep, isOptional }) =>
      draftStep !== null && !isOptional && !isStepComplete(draftStep, draft),
  );
  return incomplete?.step ?? "payment";
}

/** 주소의 단계를 실제로 열 단계로 바꿈. 없거나 잘못되면 첫 미완 단계, 1단계를 통과하지 않았으면 1단계. */
export function resolveCurrentStep({
  requested,
  steps,
  draft,
}: {
  requested: CampaignRegisterStep | null;
  steps: readonly RegisterStepDefinition[];
  draft: CampaignDraft;
}): CampaignRegisterStep {
  if (!isInfoComplete(draft)) return "campaign-info";
  const isKnown = steps.some(({ step }) => step === requested);
  return requested && isKnown
    ? requested
    : getFirstIncompleteStep(steps, draft);
}
