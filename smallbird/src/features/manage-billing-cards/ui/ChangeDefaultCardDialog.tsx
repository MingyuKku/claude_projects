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
  onCancel: () => void;
  onConfirm: () => void;
}

// Figma "결제카드 변경" 알럿(7185:124562). 변경이 성공하면 `CardChangedDialog`(7185:124652)가 이어서 열림.
export function ChangeDefaultCardDialog({
  open,
  onCancel,
  onConfirm,
}: ChangeDefaultCardDialogProps) {
  const { t } = useTranslation("features/manage-billing-cards");
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
          <AlertDialogTitle>{t("change.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("change.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {tCommon("action.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
