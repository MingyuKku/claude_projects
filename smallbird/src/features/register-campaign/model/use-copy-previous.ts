import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import {
  campaignDetailKey,
  copyCampaign,
  fetchCampaignDetail,
} from "@/entities/campaign";
import { readApiErrorReason } from "@/shared/api";
import { useTranslation } from "@/shared/i18n";
import { toIsoDate } from "@/shared/lib";

import { useDraftSaver, useRegisterWizardStore } from "./wizard-context";

const NOT_EDITABLE_REASON = "NOT_EDITABLE";

/**
 * 이전 캠페인 불러오기(A-8). 서버가 1~6단계를 지금 캠페인에 복사하면 상세를 다시 읽어 초안을 한 번 다시 채움.
 * 복사된 희망 시작일이 지난 날짜면 오늘로 바꿔 1단계를 저장함(서버가 하지 않음, v2와 같은 동작).
 */
export function useCopyPrevious({ onCopied }: { onCopied: () => void }) {
  const { t } = useTranslation("features/register-campaign");
  const { mutate } = useSWRConfig();
  const saver = useDraftSaver();
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);
  const replaceDraft = useRegisterWizardStore((state) => state.replaceDraft);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const openDialog = useRegisterWizardStore((state) => state.openDialog);
  const [isCopying, setIsCopying] = useState(false);

  async function copyFrom(sourceCampaignIdx: number) {
    setIsCopying(true);
    const [copyError] = await tryit(copyCampaign)(
      campaignIdx,
      sourceCampaignIdx,
    );
    const [readError, detail] = copyError
      ? [copyError, undefined]
      : await tryit(fetchCampaignDetail)(campaignIdx);
    setIsCopying(false);
    if (readError || !detail) {
      if (readApiErrorReason(readError) === NOT_EDITABLE_REASON) {
        openDialog("notEditable");
        return;
      }
      toast.error(t("toast.requestFailed"));
      return;
    }

    void mutate(campaignDetailKey(campaignIdx), detail, { revalidate: false });
    replaceDraft(detail.draft);
    const today = toIsoDate(new Date());
    const { startDate } = detail.draft.info;
    if (startDate !== null && startDate < today) {
      patchStepDraft("info", { startDate: today });
      void saver.save();
    }
    onCopied();
  }

  return { copyFrom, isCopying };
}
