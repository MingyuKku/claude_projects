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

import { useAddBillingCard } from "../lib/use-add-billing-card";

import type { ReturnParams } from "../lib/return-params";

interface RegisterCardDialogProps {
  open: boolean;
  /** "취소"나 Esc. */
  onCancel: () => void;
  /** 카드를 등록하고 돌아왔을 때 주소에 넣을 쿼리. 구독하려던 결제 화면을 다시 열어 이어서 결제하게 함. */
  returnParams?: ReturnParams;
}

// Figma "결제 카드 등록" 알럿(11755:96280). 등록된 카드가 없을 때 구독하기를 누르면 결제 화면 대신 띄움(스펙 §3 카드 없음).
// "결제 카드 등록하기"는 카드 추가와 같은 이니시스 카드 등록 페이지로 이동하므로, 이동하는 동안과 실패했을 때 알럿을 닫지 않음.
export function RegisterCardDialog({
  open,
  onCancel,
  returnParams,
}: RegisterCardDialogProps) {
  const { t } = useTranslation("features/manage-billing-cards");
  const { t: tCommon } = useTranslation();
  const { add, isAdding } = useAddBillingCard();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("register.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("register.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isAdding}
            onClick={(event) => {
              event.preventDefault();
              void add(returnParams);
            }}
          >
            <CreditCard aria-hidden />
            {t("register.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
