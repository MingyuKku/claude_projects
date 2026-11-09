import { useRef, useState } from "react";

import { useIsEditMode } from "./edit-mode";
import { findFirstIncompleteStep, isStepComplete } from "./step-definitions";
import { useCampaignRegisterStoreApi } from "./store-context";
import { useCampaignSave } from "./use-campaign-save";
import { useCurrentStep } from "./use-current-step";
import { useFinishEdit } from "./use-finish-edit";

import type { StepSlug } from "./steps";

/** 필수 항목 미입력 알럿. 단계 알럿은 닫기만 하고, 결제 알럿은 확인하면 첫 미완 단계로 보냄. */
export type IncompleteAlert =
  { kind: "step" } | { kind: "payment"; targetSlug: StepSlug };

/**
 * 저장한 뒤 단계를 옮김. 검사하지 않고 저장만 하며(이전·사이드바), 저장이 실패하면(실패 토스트) 옮기지 않음.
 * 이동하는 동안 같은 동작을 다시 받지 않음.
 */
export function useMoveToStep() {
  const { goToStep } = useCurrentStep();
  const { saveBeforeMove } = useCampaignSave();
  const isMovingRef = useRef(false);

  async function moveToStep(target: StepSlug) {
    if (isMovingRef.current) return;
    isMovingRef.current = true;
    try {
      if (await saveBeforeMove()) goToStep(target);
    } finally {
      isMovingRef.current = false;
    }
  }

  return { moveToStep };
}

interface StepNavigationOptions {
  /** 모든 필수 단계를 마친 상태에서 "결제하기"를 눌렀을 때. 잔액 확인과 결제는 결제 단계가 이어서 함. */
  onPay?: () => void | Promise<void>;
}

/**
 * 하단 버튼의 동작.
 * - 다음: 현재 단계를 검사하고 통과하면 저장한 뒤 다음 단계로, 아니면 "필수 항목 미입력" 알럿(단계는 그대로).
 * - 이전: 검사 없이 저장만 하고 이동.
 * - 결제하기: 모든 단계를 검사하고, 비어 있는 단계가 있으면 알럿 후 확인하면 첫 미완 단계로 보냄.
 */
export function useStepNavigation({ onPay }: StepNavigationOptions = {}) {
  const { index, step, steps } = useCurrentStep();
  const { moveToStep } = useMoveToStep();
  const storeApi = useCampaignRegisterStoreApi();
  const [alert, setAlert] = useState<IncompleteAlert | null>(null);
  const isEditMode = useIsEditMode();
  const { finishEdit } = useFinishEdit();

  const previousStep = steps[index - 1];
  const nextStep = steps[index + 1];

  async function handleClickPrevious() {
    if (previousStep) await moveToStep(previousStep.slug);
  }

  async function handleClickNext() {
    if (!step) return;
    if (!isStepComplete(step, storeApi.getState().draft)) {
      setAlert({ kind: "step" });
      return;
    }
    // 수정 모드에서는 어느 단계든 "다음"이 저장한 뒤 등록 내역으로 돌아감(스펙 §3 등록 내역).
    if (isEditMode) {
      await finishEdit();
      return;
    }
    if (nextStep) await moveToStep(nextStep.slug);
  }

  async function handleClickPay() {
    const firstIncomplete = findFirstIncompleteStep(storeApi.getState().draft);
    if (firstIncomplete) {
      setAlert({ kind: "payment", targetSlug: firstIncomplete.slug });
      return;
    }
    await onPay?.();
  }

  async function handleConfirmAlert() {
    const current = alert;
    setAlert(null);
    if (current?.kind === "payment") await moveToStep(current.targetSlug);
  }

  return {
    isEditMode,
    isFirst: index === 0,
    isLast: !nextStep,
    alert,
    closeAlert: () => setAlert(null),
    handleClickPrevious,
    handleClickNext,
    handleClickPay,
    handleConfirmAlert,
  };
}
