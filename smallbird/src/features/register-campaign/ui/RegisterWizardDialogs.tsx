import { useNavigate } from "react-router";

import { getCampaignDetailPath } from "@/entities/campaign";
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

import { useRegisterWizardStore } from "../model/wizard-context";

// 마법사 공통 알럿. 둘 다 "확인" 하나(디자인 확답 D-11).
// - 필수 항목 미입력(1단계 "다음", 시안 13320:115538): 닫기만 함.
// - 수정할 수 없는 상태(저장이 `NOT_EDITABLE`로 막힘, 문구는 스펙 §6 확정 대기 초안): 등록 내역으로 감.
export function RegisterWizardDialogs() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const dialog = useRegisterWizardStore((state) => state.dialog);
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);
  const isDemo = useRegisterWizardStore((state) => state.isDemo);
  const closeDialog = useRegisterWizardStore((state) => state.closeDialog);
  const allowLeave = useRegisterWizardStore((state) => state.allowLeave);

  function handleConfirmNotEditable() {
    closeDialog();
    allowLeave();
    void navigate(getCampaignDetailPath(campaignIdx), { replace: true });
  }

  return (
    <>
      <AlertDialog
        open={dialog === "requiredInfo"}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dialog.requiredInfo.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.requiredInfo.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeDialog}>
              {tCommon("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={dialog === "notEditable"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.notEditable.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                isDemo
                  ? "dialog.notEditable.demoDescription"
                  : "dialog.notEditable.description",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmNotEditable}>
              {tCommon("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
