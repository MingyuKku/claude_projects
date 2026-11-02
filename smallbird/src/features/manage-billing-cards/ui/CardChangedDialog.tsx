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

interface CardChangedDialogProps {
  open: boolean;
  onConfirm: () => void;
}

// Figma "결제카드 변경 완료" 알럿(7185:124652). 완료 안내라 "확인"만 둠(스펙 §3 공통).
// 서버 반영이 가능해지면 `ChangeDefaultCardDialog` 확인이 성공한 뒤 열도록 연결함(목 단계는 도달할 수 없어 연결하지 않음).
export function CardChangedDialog({ open, onConfirm }: CardChangedDialogProps) {
  const { t } = useTranslation("features/manage-billing-cards");
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
          <AlertDialogTitle>{t("change.completed.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("change.completed.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
