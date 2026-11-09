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

interface LoadPreviousOverwriteAlertProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// 지금 입력한 값이 하나라도 있을 때 덮어쓰기를 확인함(문구는 스펙 §6, Figma에 없음).
export function LoadPreviousOverwriteAlert({
  open,
  onCancel,
  onConfirm,
}: LoadPreviousOverwriteAlertProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("loadPrevious.overwrite.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("loadPrevious.overwrite.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("loadPrevious.overwrite.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
