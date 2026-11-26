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
 * 반환값은 저장 없이 "이전"·나가기를 해도 되는지: 토스트만 띄운 실패는 true, 알럿·화면 전환으로 처리한 실패(수정 불가·읽을 수 없는 캠페인)는 false.
 */
export function useSaveResultHandler() {
  const { t } = useTranslation("features/register-campaign");
  const { mutate } = useSWRConfig();
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);
  const openDialog = useRegisterWizardStore((state) => state.openDialog);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  return function handleFailedSave(
    result: Extract<SaveResult, { ok: false }>,
  ): boolean {
    if (result.isUploadFailure) {
      toast.error(t(getUploadErrorKeyByReason(result.reason)));
      return true;
    }
    if (result.reason === NOT_EDITABLE_REASON) {
      openDialog("notEditable");
      return false;
    }
    if (isUnreadableCampaignReason(result.reason)) {
      void mutate(campaignDetailKey(campaignIdx));
      return false;
    }
    if (result.reason === INVALID_BRAND_REASON) {
      patchStepDraft("info", { brandIdx: null });
      void mutate(BRANDS_KEY);
    }
    toast.error(t("toast.saveFailed"));
    return true;
  };
}
