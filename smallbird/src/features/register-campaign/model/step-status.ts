import { isStepComplete, isStepStarted } from "./step-completion";

import type { RegisterStepDefinition } from "./steps";
import type { CampaignDraft, CampaignRegisterStep } from "@/entities/campaign";

// 사이드바 단계 상태(스펙 §3 단계 사이드바). 1단계를 통과하기 전에는 2~8단계를 막고, 오른쪽 표시는
// 결제 단계에 들어온 뒤의 필수 미입력 경고 → 그 밖에 일부만 입력한(현재 단계가 아닌) 단계의 입력 중 순으로 정함.

export type StepState = "default" | "current" | "disabled";
export type StepIndicator = "editing" | "warning" | null;

export interface StepStatus {
  step: CampaignRegisterStep;
  state: StepState;
  indicator: StepIndicator;
}

export function isInfoComplete(draft: CampaignDraft) {
  return isStepComplete("info", draft);
}

function getIndicator(
  definition: RegisterStepDefinition,
  draft: CampaignDraft,
  isCurrent: boolean,
  hasVisitedPayment: boolean,
): StepIndicator {
  const { draftStep, isOptional } = definition;
  if (draftStep === null || isOptional) return null;
  if (isStepComplete(draftStep, draft)) return null;
  if (hasVisitedPayment) return "warning";
  if (!isCurrent && isStepStarted(draftStep, draft)) return "editing";
  return null;
}

export function getStepStatuses({
  steps,
  draft,
  currentStep,
  hasVisitedPayment,
}: {
  steps: readonly RegisterStepDefinition[];
  draft: CampaignDraft;
  currentStep: CampaignRegisterStep;
  hasVisitedPayment: boolean;
}): StepStatus[] {
  const isUnlocked = isInfoComplete(draft);
  return steps.map((definition) => {
    const isCurrent = definition.step === currentStep;
    const isLocked = !isUnlocked && definition.draftStep !== "info";
    let state: StepState = "default";
    if (isCurrent) state = "current";
    else if (isLocked) state = "disabled";
    return {
      step: definition.step,
      state,
      indicator: getIndicator(definition, draft, isCurrent, hasVisitedPayment),
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
