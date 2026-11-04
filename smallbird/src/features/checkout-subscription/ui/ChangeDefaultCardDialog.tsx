import { CreditCard } from "lucide-react";

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

interface ChangeDefaultCardDialogProps {
  open: boolean;
  /** 바꾸는 동안 두 버튼을 잠금. */
  isChanging: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Figma "기본 카드 변경" 알럿(11755:99783). 결제 화면에서 기본 카드가 아닌 카드를 골랐을 때 띄움(스펙 §3 기본 카드 변경).
// 확인을 눌러도 바꾸는 요청이 끝날 때까지 닫지 않으므로 기본 동작(닫힘)을 막음.
export function ChangeDefaultCardDialog({
  open,
  isChanging,
  onCancel,
  onConfirm,
}: ChangeDefaultCardDialogProps) {
  const { t } = useTranslation("features/checkout-subscription");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("changeDefault.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("changeDefault.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isChanging}>
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isChanging}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            <CreditCard aria-hidden />
            {t("changeDefault.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
