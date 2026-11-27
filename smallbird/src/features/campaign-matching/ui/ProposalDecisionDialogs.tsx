import { useState } from "react";

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

import type { DecisionDialog } from "../lib/use-proposal-decision";

interface ProposalDecisionDialogsProps {
  dialog: DecisionDialog | null;
  isBusy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onPayNow: () => void;
  onClose: () => void;
}

// 수락 확인 → (수락 성공) 이어서 결제 진행, 거절 확인(시안 캡션 "수락 > 다음 알럿 호출").
export function ProposalDecisionDialogs({
  dialog,
  isBusy,
  onAccept,
  onReject,
  onPayNow,
  onClose,
}: ProposalDecisionDialogsProps) {
  const { t } = useTranslation("features/campaign-matching");
  // 닫히는 동안(애니메이션) 문구가 바뀌지 않게 마지막으로 연 창을 기억함.
  const [lastDialog, setLastDialog] = useState<DecisionDialog>("accept");
  if (dialog !== null && dialog !== lastDialog) setLastDialog(dialog);
  const key = dialog ?? lastDialog;
  const confirm = { accept: onAccept, reject: onReject, payNow: onPayNow }[key];

  return (
    <AlertDialog
      open={dialog !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`decision.${key}.title`)}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {t(`decision.${key}.description`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t(`decision.${key}.cancel`)}</AlertDialogCancel>
          <AlertDialogAction
            destructive={key === "reject"}
            disabled={isBusy}
            onClick={(event) => {
              // 요청이 끝난 뒤 다음 창으로 바꾸므로 여기서 닫지 않음.
              event.preventDefault();
              confirm();
            }}
          >
            {t(`decision.${key}.confirm`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
