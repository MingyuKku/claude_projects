import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  CAMPAIGN_STEP_PARAM,
  toCampaignRegisterStep,
} from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";

import { isInfoComplete, resolveCurrentStep } from "./step-status";
import { getRegisterSteps } from "./steps";
import { useSaveResultHandler } from "./use-save-result-handler";
import {
  useDraftSaver,
  useRegisterWizardStore,
  useRegisterWizardStoreApi,
} from "./wizard-context";

import type { PendingSaveAction } from "./store";
import type { CampaignRegisterStep } from "@/entities/campaign";

/**
 * 현재 단계(`?step=`)와 단계 이동. 단계를 옮길 때마다 바뀐 단계를 저장하고, 저장이 실패하면 옮기지 않음(하단 "이전"만 예외로
 * 실패 토스트를 띄우고 옮김).
 * 검사는 1단계 "다음"에만 있고 그 밖의 이동(이전·다음·사이드바)은 저장만 함(스펙 §3 필수값 검증).
 * 단계 이동은 기록을 쌓지 않아(replace) 헤더 "<"·브라우저 뒤로가기는 마법사를 떠남.
 */
export function useWizardNavigation() {
  const { t } = useTranslation("features/register-campaign");
  const [searchParams, setSearchParams] = useSearchParams();
  const saver = useDraftSaver();
  const store = useRegisterWizardStoreApi();
  const handleFailedSave = useSaveResultHandler();
  const serviceType = useRegisterWizardStore((state) => state.serviceType);
  const productType = useRegisterWizardStore((state) => state.productType);
  const draft = useRegisterWizardStore((state) => state.draft);
  const openDialog = useRegisterWizardStore((state) => state.openDialog);

  const steps = getRegisterSteps(serviceType, productType);
  const requested = toCampaignRegisterStep(
    searchParams.get(CAMPAIGN_STEP_PARAM),
  );
  const currentStep = resolveCurrentStep({ requested, steps, draft });
  const currentIndex = steps.findIndex(({ step }) => step === currentStep);
  const previousStep = steps[currentIndex - 1]?.step ?? null;
  const nextStep = steps[currentIndex + 1]?.step ?? null;

  /** 누른 동작을 표시하고 저장함. 이미 저장을 기다리는 중이면 보내지 않고 null(중복 클릭·연속 이동 막기). */
  async function saveFor(action: PendingSaveAction) {
    const { pendingSave, startPendingSave } = store.getState();
    if (pendingSave !== null) return null;
    startPendingSave(action);
    try {
      return await saver.save({ skipUnseenDefaults: true });
    } finally {
      store.getState().endPendingSave(action);
    }
  }

  /** `canLeaveOnFail`이면 저장이 토스트만 띄운 실패일 때도 옮김(입력값은 화면에 남아 다음 저장 때 다시 보냄). */
  async function goToStep(
    target: CampaignRegisterStep,
    {
      canLeaveOnFail = false,
      action = "next",
    }: { canLeaveOnFail?: boolean; action?: PendingSaveAction } = {},
  ) {
    const result = await saveFor(action);
    if (!result) return;
    if (!result.ok) {
      const canLeave = handleFailedSave(result);
      if (!canLeave || !canLeaveOnFail) return;
    }
    // 저장을 기다리는 사이 떠나기를 눌렀으면 옮기지 않음. 옮기면 라우터가 막아 둔 떠나기를 풀어 떠나지 못함.
    if (store.getState().pendingSaves.includes("leave")) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set(CAMPAIGN_STEP_PARAM, target);
        return params;
      },
      { replace: true },
    );
  }

  function goNext() {
    if (currentStep === "campaign-info" && !isInfoComplete(draft)) {
      openDialog("requiredInfo");
      return;
    }
    if (nextStep) void goToStep(nextStep);
  }

  function goPrevious() {
    if (previousStep) {
      void goToStep(previousStep, { canLeaveOnFail: true, action: "previous" });
    }
  }

  async function saveTemporarily() {
    const result = await saveFor("saveDraft");
    if (!result) return;
    if (!result.ok) {
      handleFailedSave(result);
      return;
    }
    toast.success(t("toast.saved"));
  }

  return {
    steps,
    requested,
    currentStep,
    previousStep,
    nextStep,
    goToStep,
    goNext,
    goPrevious,
    saveTemporarily,
  };
}

/**
 * 주소의 단계가 없거나 열 수 없으면 실제로 연 단계로 바꿔(replace) 새로고침해도 같은 단계가 열리게 함.
 * 연 단계는 기본 선택을 사용자가 본 것으로 보고 저장을 미루지 않음. 마법사 본문에서 한 번만 부름.
 */
export function useSyncCurrentStep() {
  const [, setSearchParams] = useSearchParams();
  const { steps, requested, currentStep } = useWizardNavigation();
  const markStepShown = useRegisterWizardStore((state) => state.markStepShown);

  useEffect(() => {
    if (requested === currentStep) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set(CAMPAIGN_STEP_PARAM, currentStep);
        return params;
      },
      { replace: true },
    );
  }, [requested, currentStep, setSearchParams]);

  const currentDraftStep =
    steps.find(({ step }) => step === currentStep)?.draftStep ?? null;
  useEffect(() => {
    if (currentDraftStep) markStepShown(currentDraftStep);
  }, [currentDraftStep, markStepShown]);
}
