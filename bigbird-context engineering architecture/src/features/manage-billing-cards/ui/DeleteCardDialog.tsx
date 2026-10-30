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

import type { BillingCard } from "@/entities/subscription";

interface DeleteCardDialogProps {
  open: boolean;
  /** 삭제를 확인받는 카드. 닫히는 동안에도 문구가 바뀌지 않게 호출하는 쪽이 남겨 둠(`useDialogTarget`). */
  card: BillingCard | null;
  onCancel: () => void;
  onConfirm: () => void;
}

// 시안에 없는 알럿(스펙 §6, 사용자 결정: 추천 문구). Destructive 알럿 구조는 구독 해지(7064:180462)와 같음.
export function DeleteCardDialog({
  open,
  card,
  onCancel,
  onConfirm,
}: DeleteCardDialogProps) {
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
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("delete.description", {
              issuer: card?.issuer ?? "",
              number: card?.maskedNumber ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-foreground">
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction destructive onClick={onConfirm}>
            {t("delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
