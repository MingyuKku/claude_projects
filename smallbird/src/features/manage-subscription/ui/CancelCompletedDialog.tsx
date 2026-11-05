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

interface CancelCompletedDialogProps {
  open: boolean;
  onConfirm: () => void;
}

// Figma "구독 해지 완료" 알럿(7064:180448). 완료 안내라 "확인"만 둠(스펙 §3 공통).
export function CancelCompletedDialog({
  open,
  onConfirm,
}: CancelCompletedDialogProps) {
  const { t } = useTranslation("features/manage-subscription");
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
          <AlertDialogTitle>
            {t("cancelDialog.completed.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("cancelDialog.completed.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
