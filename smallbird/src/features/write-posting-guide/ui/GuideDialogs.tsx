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

export type GuideDialog = "skip" | "confirm";

interface GuideDialogsProps {
  dialog: GuideDialog | null;
  onClose: () => void;
  onSkip: () => void;
  onConfirm: () => void;
}

// 건너뛰기(시안 14165:271830)·확정(시안 14165:272914) 알럿. 둘 다 취소/실행이고, 확정 알럿은 확정 전에 묻는 창(사용자 2026-11-26).
export function GuideDialogs({
  dialog,
  onClose,
  onSkip,
  onConfirm,
}: GuideDialogsProps) {
  const { t } = useTranslation("features/write-posting-guide");
  const { t: tCommon } = useTranslation();
  const content =
    dialog === "skip"
      ? {
          title: t("dialog.skip.title"),
          description: t("dialog.skip.description"),
          action: t("dialog.skip.action"),
          onAction: onSkip,
        }
      : {
          title: t("dialog.confirm.title"),
          description: t("dialog.confirm.description"),
          action: tCommon("action.confirm"),
          onAction: onConfirm,
        };

  return (
    <AlertDialog
      open={dialog !== null}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription>{content.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={content.onAction}>
            {content.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
