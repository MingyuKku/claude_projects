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
import { useDraftSaver, useRegisterWizardStore } from "./wizard-context";

import type { CampaignRegisterStep } from "@/entities/campaign";

/**
 * 현재 단계(`?step=`)와 단계 이동. 단계를 옮길 때마다 바뀐 단계를 저장하고, 저장이 실패하면 옮기지 않음.
 * 검사는 1단계 "다음"에만 있고 그 밖의 이동(이전·다음·사이드바)은 저장만 함(스펙 §3 필수값 검증).
 * 단계 이동은 기록을 쌓지 않아(replace) 헤더 "<"·브라우저 뒤로가기는 마법사를 떠남.
 */
export function useWizardNavigation() {
  const { t } = useTranslation("features/register-campaign");
  const [searchParams, setSearchParams] = useSearchParams();
  const saver = useDraftSaver();
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

  async function goToStep(target: CampaignRegisterStep) {
    const result = await saver.save();
    if (!result.ok) {
      handleFailedSave(result);
      return;
    }
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
    if (previousStep) void goToStep(previousStep);
  }

  async function saveTemporarily() {
    const result = await saver.save();
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
 * 주소의 단계가 없거나 열 수 없으면 실제로 연 단계로 바꿔(replace) 새로고침해도 같은 단계가 열리게 하고, 결제 단계에
 * 들어오면 사이드바 경고를 켬. 마법사 본문에서 한 번만 부름.
 */
export function useSyncCurrentStep() {
  const [, setSearchParams] = useSearchParams();
  const { requested, currentStep } = useWizardNavigation();
  const markPaymentVisited = useRegisterWizardStore(
    (state) => state.markPaymentVisited,
  );

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

  useEffect(() => {
    if (currentStep === "payment") markPaymentVisited();
  }, [currentStep, markPaymentVisited]);
}
