import { generatePath, useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import { reloadPage } from "../model/reload-page";
import {
  useCampaignRegisterStore,
  useCampaignRegisterStoreApi,
} from "../model/store-context";

// 저장이 막혔을 때의 안내(자동 저장·단계 이동·"다음" 어디서든 같은 알럿). 막힌 뒤에는 자동 저장도 멈추므로 "확인"으로만 벗어남.
// - NOT_EDITABLE: 수정하는 사이 심사가 시작됐거나 승인돼 더 이상 고칠 수 없음 → 등록 내역으로 보냄.
// - VERSION_CONFLICT: 다른 화면에서 먼저 수정됨 → 화면을 새로 불러 최신 내용으로 다시 엶.
export function SaveBlockedAlert() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const storeApi = useCampaignRegisterStoreApi();
  const reason = useCampaignRegisterStore((state) => state.saveBlockedReason);

  function handleConfirm() {
    if (reason === "NOT_EDITABLE") {
      void navigate(
        generatePath(ROUTES.campaignDetail, {
          campaignId: String(storeApi.getState().draft.campaignIdx),
        }),
        { replace: true },
      );
      return;
    }
    reloadPage();
  }

  return (
    <AlertDialog open={reason !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {reason ? t(`saveBlocked.${reason}.title`) : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reason ? t(`saveBlocked.${reason}.description`) : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>
            {tCommon("action.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
