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

import { useSubscriptionFormat } from "../lib/use-subscription-format";

import type { Subscription } from "@/entities/subscription";

interface CancelSubscriptionDialogProps {
  open: boolean;
  /** 해지를 확인받는 구독. 닫히는 동안에도 문구가 바뀌지 않게 호출하는 쪽이 남겨 둠(`useDialogTarget`). */
  subscription: Subscription | null;
  onCancel: () => void;
  onConfirm: () => void;
}

// Figma "구독 해지" Destructive 알럿(7064:180462). 해지가 성공하면 `CancelCompletedDialog`(7064:180448)가 이어서 열림.
export function CancelSubscriptionDialog({
  open,
  subscription,
  onCancel,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  const { t } = useTranslation("features/manage-subscription");
  const { t: tCommon } = useTranslation();
  const { formatLongDate } = useSubscriptionFormat();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("cancelDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("cancelDialog.description", {
              endsAt: subscription ? formatLongDate(subscription.endsAt) : "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-foreground">
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction destructive onClick={onConfirm}>
            {t("cancelDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
