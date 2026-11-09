import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import {
  campaignDraftKey,
  campaignKey,
  copyPreviousCampaign,
} from "@/entities/campaign";
import { isApiError } from "@/shared/api";
import { useTranslation } from "@/shared/i18n";

import { adjustPastStartDate } from "../lib/adjust-start-date";
import { useCampaignRegisterStoreApi } from "./store-context";
import { useCampaignSave } from "./use-campaign-save";

interface UseLoadPreviousCampaignOptions {
  /** 불러오기를 마쳤을 때(하위 화면을 닫음). */
  onLoaded: () => void;
  /** 원본 캠페인이 없어졌을 때(목록을 다시 읽음). */
  onSourceNotFound: () => void;
}

/**
 * 고른 이전 캠페인의 1~6단계 입력값을 지금 캠페인에 복사함(캠페인 코드는 유지, 약관 동의·결제는 복사하지 않음).
 * 1) 아직 저장하지 않은 변경을 먼저 저장하고(서버가 버전으로 덮어쓰기를 막으므로) 2) 서버가 복사한 초안으로 store를 통째로 바꾸고
 * 3) 희망 시작일이 지난 날짜면 오늘로 맞춰(저장은 자동 저장이 이어 받음) 4) 가 본 단계를 다시 남김.
 */
export function useLoadPreviousCampaign({
  onLoaded,
  onSourceNotFound,
}: UseLoadPreviousCampaignOptions) {
  const { t: tCommon } = useTranslation();
  const { mutate } = useSWRConfig();
  const storeApi = useCampaignRegisterStoreApi();
  const { saveBeforeMove } = useCampaignSave();
  const [isLoading, setIsLoading] = useState(false);

  async function loadPrevious(sourceCampaignIdx: number) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (!(await saveBeforeMove())) return;
      const { draft } = storeApi.getState();
      const copied = await copyPreviousCampaign(
        draft.campaignIdx,
        sourceCampaignIdx,
      );
      const state = storeApi.getState();
      state.replaceWithSavedDraft(copied);
      // 서버는 가 본 단계를 비우므로 지금 보고 있는 1단계를 다시 남김.
      state.markVisited("CAMPAIGN_INFO");
      const adjusted = adjustPastStartDate(copied);
      if (adjusted !== copied) {
        state.patchCampaignInfo({ startDate: adjusted.campaignInfo.startDate });
      }
      // 같은 캠페인에 다시 들어올 때 복사 전 값으로 채워지지 않게 캐시를 맞춤.
      await Promise.all([
        mutate(campaignDraftKey(copied.campaignIdx), copied, {
          revalidate: false,
        }),
        mutate(campaignKey(copied.campaignIdx), undefined, {
          revalidate: false,
        }),
      ]).catch(() => undefined);
      onLoaded();
    } catch (error) {
      const reason = isApiError(error)
        ? (error.data as { reason?: string } | undefined)?.reason
        : undefined;
      if (reason === "SOURCE_NOT_FOUND") onSourceNotFound();
      console.error(error);
      toast.error(tCommon("error.unexpected"));
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, loadPrevious };
}
