import { tryit } from "radash";
import { useEffect } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import { generateCampaignIntro } from "../api/generate-campaign-intro";
import { useRegisterWizardStoreApi } from "./wizard-context";

import type { CampaignRegisterStep } from "@/entities/campaign";

/**
 * AI 소개서 생성을 시작함. 결과는 store에 들어가므로 5단계를 떠나도 이어서 받음.
 * 생성 중에 다시 부르면 무시함.
 */
export function useGenerateIntro() {
  const store = useRegisterWizardStoreApi();

  return async function generateIntro() {
    const { campaignIdx, introAi, startIntroGeneration } = store.getState();
    if (introAi.jobId !== null) return;
    const jobId = startIntroGeneration();
    const [error, intro] = await tryit(generateCampaignIntro)(
      campaignIdx,
      introAi.url.trim(),
    );
    store.getState().finishIntroGeneration(jobId, error ? null : intro);
  };
}

/**
 * AI 생성이 끝나면 알림. 실패는 늘 토스트, 완료는 5단계가 아닌 곳에 있을 때만 토스트(5단계에서는 결과 카드가 바로 보임).
 * 마법사가 열려 있는 동안 늘 마운트된 곳에서 부름.
 */
export function useIntroGenerationNotice(currentStep: CampaignRegisterStep) {
  const { t } = useTranslation("features/register-campaign");
  const store = useRegisterWizardStoreApi();

  useEffect(
    () =>
      store.subscribe((state, prev) => {
        const isFinished =
          prev.introAi.jobId !== null && state.introAi.jobId === null;
        if (!isFinished) return;
        if (state.introAi.lastOutcome === "FAILED") {
          toast.error(t("toast.aiFailed"));
          return;
        }
        if (
          state.introAi.lastOutcome === "SUCCEEDED" &&
          currentStep !== "intro"
        ) {
          toast.success(t("toast.aiCompleted"));
        }
      }),
    [store, currentStep, t],
  );
}
