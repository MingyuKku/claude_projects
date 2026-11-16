import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import { useRegisterWizardStore } from "./wizard-context";

import type { SaveResult } from "./draft-saver";

const NOT_EDITABLE_REASON = "NOT_EDITABLE";

/**
 * 저장 실패 처리. 수정할 수 없는 상태(심사 시작·승인, 작성 완료 데모)면 안내 알럿 뒤 등록 내역으로 보내고,
 * 그 밖은 실패 토스트를 띄움(입력값은 화면에 남아 다시 저장할 수 있음, REQ-10-0012).
 */
export function useSaveResultHandler() {
  const { t } = useTranslation("features/register-campaign");
  const openDialog = useRegisterWizardStore((state) => state.openDialog);

  return function handleFailedSave(result: Extract<SaveResult, { ok: false }>) {
    if (result.reason === NOT_EDITABLE_REASON) {
      openDialog("notEditable");
      return;
    }
    toast.error(t("toast.saveFailed"));
  };
}
