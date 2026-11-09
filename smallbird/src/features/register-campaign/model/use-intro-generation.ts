import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { isApiError } from "@/shared/api";
import { useTranslation } from "@/shared/i18n";

import {
  fetchIntroGeneration,
  startIntroGeneration,
} from "../api/register-api";
import {
  useCampaignRegisterStore,
  useCampaignRegisterStoreApi,
} from "./store-context";

import type { StepSlug } from "./steps";

/** 화면이 생성 결과를 확인하는 간격(요구 명세 A-10: 5초). */
export const INTRO_GENERATION_POLL_MS = 5000;

/** 5단계 AI 생성 시작. 이미 생성 중이면(409) 그 작업을 이어서 기다림. */
export function useIntroGenerationStart() {
  const { t } = useTranslation("features/register-campaign");
  const storeApi = useCampaignRegisterStoreApi();
  const patchIntro = useCampaignRegisterStore((state) => state.patchIntro);
  const [isStarting, setIsStarting] = useState(false);

  async function start(sourceUrl: string) {
    const url = sourceUrl.trim();
    setIsStarting(true);
    try {
      const { jobId } = await startIntroGeneration(
        storeApi.getState().draft.campaignIdx,
        url,
      );
      patchIntro({ sourceUrl: url, aiJob: { jobId, status: "PENDING" } });
    } catch (error) {
      const running = isApiError(error) && error.status === 409;
      const runningJobId = running
        ? (error.data as { jobId?: string } | undefined)?.jobId
        : undefined;
      if (runningJobId) {
        patchIntro({
          sourceUrl: url,
          aiJob: { jobId: runningJobId, status: "PENDING" },
        });
      } else {
        toast.error(t("intro.ai.startFailed"));
      }
    } finally {
      setIsStarting(false);
    }
  }

  return { start, isStarting };
}

/**
 * 진행 중인 AI 생성 작업(`intro.aiJob`)을 5초마다 확인하고, 끝나면 결과를 5단계 칸에 채움.
 * 다른 단계로 이동해도 이어서 기다려야 해서 5단계 화면이 아니라 마법사에서 한 번만 씀.
 * 실패하면 토스트로 알리고 기존 입력은 그대로 둠.
 */
export function useIntroGenerationWatcher(currentSlug: StepSlug) {
  const { t } = useTranslation("features/register-campaign");
  const campaignIdx = useCampaignRegisterStore(
    (state) => state.draft.campaignIdx,
  );
  const aiJob = useCampaignRegisterStore((state) => state.draft.intro.aiJob);
  const patchIntro = useCampaignRegisterStore((state) => state.patchIntro);
  const jobId = aiJob?.status === "PENDING" ? aiJob.jobId : null;

  const { data, error } = useSWR(
    jobId ? ["campaign", campaignIdx, "intro-generation", jobId] : null,
    () => fetchIntroGeneration(campaignIdx, jobId ?? ""),
    {
      refreshInterval: INTRO_GENERATION_POLL_MS,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const isLost = isApiError(error) && error.status === 404;

  useEffect(() => {
    if (!jobId) return;
    if (data?.status === "DONE" && data.result) {
      patchIntro({ ...data.result, aiJob: { jobId, status: "DONE" } });
      // 5단계에 있으면 결과 카드가 바로 보이므로, 다른 단계에 있을 때만 알림.
      if (currentSlug !== "intro") toast.success(t("intro.ai.done"));
    } else if (data?.status === "FAILED" || isLost) {
      toast.error(t("intro.ai.failed"));
      patchIntro({ aiJob: null });
    }
  }, [jobId, data, isLost, currentSlug, patchIntro, t]);
}
