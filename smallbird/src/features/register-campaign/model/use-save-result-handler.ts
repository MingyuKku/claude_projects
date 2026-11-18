import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { BRANDS_KEY } from "@/entities/brand";
import {
  campaignDetailKey,
  isUnreadableCampaignReason,
} from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";

import { getUploadErrorKeyByReason } from "./upload-error";
import { useRegisterWizardStore } from "./wizard-context";

import type { SaveResult } from "./draft-saver";

const NOT_EDITABLE_REASON = "NOT_EDITABLE";
const INVALID_BRAND_REASON = "INVALID_BRAND";

/**
 * 저장 실패 처리. 수정할 수 없는 상태(심사 시작·승인, 작성 완료 데모)면 안내 알럿 뒤 등록 내역으로 보내고,
 * 캠페인을 읽을 수 없게 됐으면 상세를 다시 읽어 페이지가 찾을 수 없음으로 넘어가게 하며, 브랜드가 사라졌으면 선택을
 * 비움. 파일 올리기 실패는 형식·용량 안내나 실패 토스트를, 그 밖은 실패 토스트를 띄움(입력값은 화면에 남아 다시 저장할 수 있음).
 */
export function useSaveResultHandler() {
  const { t } = useTranslation("features/register-campaign");
  const { mutate } = useSWRConfig();
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);
  const openDialog = useRegisterWizardStore((state) => state.openDialog);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  return function handleFailedSave(result: Extract<SaveResult, { ok: false }>) {
    if (result.isUploadFailure) {
      toast.error(t(getUploadErrorKeyByReason(result.reason)));
      return;
    }
    if (result.reason === NOT_EDITABLE_REASON) {
      openDialog("notEditable");
      return;
    }
    if (isUnreadableCampaignReason(result.reason)) {
      void mutate(campaignDetailKey(campaignIdx));
      return;
    }
    if (result.reason === INVALID_BRAND_REASON) {
      patchStepDraft("info", { brandIdx: null });
      void mutate(BRANDS_KEY);
    }
    toast.error(t("toast.saveFailed"));
  };
}
