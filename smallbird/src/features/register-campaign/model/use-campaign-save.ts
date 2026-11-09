import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import { useAutosaveController } from "./save-context";
import { useCampaignRegisterStoreApi } from "./store-context";

/**
 * 기다리지 않고 지금 저장하는 동작. 자동 저장과 같은 컨트롤러를 써서 보내는 중인 저장과 겹치지 않음.
 * - `saveBeforeMove`: 단계 이동(이전·다음·사이드바·기본정보) 직전. 실패하면 실패 토스트를 띄우고 false를 돌려주니 이동하지 않아야 함.
 * - `saveDraft`: "임시저장". 결과를 토스트로 알림.
 */
export function useCampaignSave() {
  const { t } = useTranslation("features/register-campaign");
  const controller = useAutosaveController();
  const storeApi = useCampaignRegisterStoreApi();

  // 저장이 막힌 경우(수정 불가·버전 충돌)는 전용 알럿(`SaveBlockedAlert`)이 이유를 알리므로 같은 내용을 토스트로 또 띄우지 않음.
  function notifyFailure() {
    if (storeApi.getState().saveBlockedReason === null) {
      toast.error(t("toast.saveFailed"));
    }
  }

  async function saveBeforeMove() {
    const isSaved = await controller.flush();
    if (!isSaved) notifyFailure();
    return isSaved;
  }

  async function saveDraft() {
    const isSaved = await controller.flush();
    if (isSaved) toast.success(t("toast.saved"));
    else notifyFailure();
    return isSaved;
  }

  return { saveBeforeMove, saveDraft };
}
