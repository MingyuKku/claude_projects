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

interface RemoveFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveFolderDialog({
  isOpen,
  onClose,
  onConfirm,
}: RemoveFolderDialogProps) {
  const { t } = useTranslation("features/manage-folders");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("remove.title")}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {t("remove.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-foreground">
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction destructive onClick={onConfirm}>
            {t("remove.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
