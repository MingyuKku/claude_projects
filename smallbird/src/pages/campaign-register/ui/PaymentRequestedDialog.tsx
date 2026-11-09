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

interface PaymentRequestedDialogProps {
  open: boolean;
  onConfirm: () => void;
}

// 결제창에서 돌아와 충전 요청이 접수된 것을 알림. 문구는 마이페이지와 같음(스펙 D-13). 무통장 입금이라 입금이 확인돼야 잔액이 늘어서 즉시 "충전 완료"는 아님. "확인"만 둠.
export function PaymentRequestedDialog({
  open,
  onConfirm,
}: PaymentRequestedDialogProps) {
  const { t } = useTranslation("pages/campaign-register");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onConfirm();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("requested.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("requested.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
