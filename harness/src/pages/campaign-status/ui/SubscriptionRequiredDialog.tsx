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

interface SubscriptionRequiredDialogProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export function SubscriptionRequiredDialog({
  open,
  onClose,
  onSubscribe,
}: SubscriptionRequiredDialogProps) {
  const { t } = useTranslation("pages/campaign-status");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("subscriptionRequired.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("subscriptionRequired.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onSubscribe}>
            {t("subscriptionRequired.subscribe")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
