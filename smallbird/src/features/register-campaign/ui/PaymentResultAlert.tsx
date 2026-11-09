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

import type { PaymentAlert } from "../model/use-campaign-payment";

interface PaymentResultAlertProps {
  alert: PaymentAlert | null;
  onClose: () => void;
}

// 결제 알럿(Figma Alert Dialog 7555:336030 잔액 부족, 7555:336029 결제 완료). 시안의 "취소"는 정보성 알럿이라 두지 않고 "확인"만 둠(스펙 §6).
export function PaymentResultAlert({
  alert,
  onClose,
}: PaymentResultAlertProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={alert !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alert ? t(`payment.alert.${alert}.title`) : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {alert ? t(`payment.alert.${alert}.description`) : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
