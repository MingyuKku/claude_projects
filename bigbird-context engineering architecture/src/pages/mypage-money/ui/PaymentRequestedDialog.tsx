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

// 결제창에서 돌아와 충전 요청이 접수된 것을 알림(Figma 충전 완료 알럿 문구를 무통장 입금에 맞춤, 스펙 §6). "확인"만 둠.
export function PaymentRequestedDialog({
  open,
  onConfirm,
}: PaymentRequestedDialogProps) {
  const { t } = useTranslation("pages/mypage-money");
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
