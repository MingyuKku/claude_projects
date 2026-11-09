import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import type { IncompleteAlert } from "../model/use-step-navigation";

interface IncompleteStepsAlertProps {
  alert: IncompleteAlert | null;
  onClose: () => void;
  onConfirm: () => void;
}

// 필수 항목 미입력 알럿(Figma Alert Dialog 7555:333711). "다음"을 눌렀을 때는 "취소"·"확인" 모두 닫기만 하고 단계는 그대로임.
// "결제하기"를 눌렀을 때는(문구는 스펙 §6) "확인"만 두고, 확인하면 첫 미완 단계로 보냄.
export function IncompleteStepsAlert({
  alert,
  onClose,
  onConfirm,
}: IncompleteStepsAlertProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const isPayment = alert?.kind === "payment";

  return (
    <AlertDialog
      open={alert !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("incomplete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {isPayment
              ? t("incomplete.payDescription")
              : t("incomplete.stepDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isPayment && (
            <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          )}
          <AlertDialogAction onClick={onConfirm}>
            {tCommon("action.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
