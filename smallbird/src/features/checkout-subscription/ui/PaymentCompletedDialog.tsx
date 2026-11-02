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

interface PaymentCompletedDialogProps {
  open: boolean;
  onConfirm: () => void;
}

// 결제 완료 알럿. 완료 안내라 "확인"만 둠(스펙 §3 공통, Figma의 "취소"는 두지 않음).
export function PaymentCompletedDialog({
  open,
  onConfirm,
}: PaymentCompletedDialogProps) {
  const { t } = useTranslation("features/checkout-subscription");
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
          <AlertDialogTitle>{t("completed.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("completed.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
