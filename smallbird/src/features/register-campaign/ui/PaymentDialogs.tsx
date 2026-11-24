import { useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";
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

import { CHARGE_AREA_ID } from "../model/use-payment-flow";

import type { PaymentDialog } from "../model/use-payment-flow";
import type { CampaignRegisterStep } from "@/entities/campaign";

interface PaymentDialogsProps {
  dialog: PaymentDialog | null;
  onClose: () => void;
  onGoToStep: (step: CampaignRegisterStep) => void;
  onLeaveToDetail: () => void;
  /** 데모 작성 완료 확인의 "확인". */
  onCompleteDemo: () => void;
  /** 작성 완료 요청 중이면 "확인"을 막음. */
  isBusy: boolean;
  /**
   * 결제 완료·재승인 요청 완료 알럿의 "확인"을 눌렀을 때 등록 내역으로 가기 전에 부름(승인 결과를 기다리는 순간).
   * 클릭 핸들러 안에서 동기로 불러서, 알림 권한 창처럼 직접 동작이 필요한 일을 할 수 있음.
   */
  onApprovalRequested?: () => void;
}

const DIALOG_KEYS = {
  required: "payment.dialog.required",
  insufficientBalance: "payment.dialog.insufficientBalance",
  completed: "payment.dialog.completed",
  failed: "payment.dialog.failed",
  invalidStartDate: "payment.dialog.invalidStartDate",
  subscriptionRequired: "payment.dialog.subscriptionRequired",
  demoConfirm: "payment.dialog.demoConfirm",
  reapprovalCompleted: "detail.dialog.reapproval",
} as const satisfies Record<PaymentDialog["type"], string>;

function focusChargeArea() {
  const area = document.getElementById(CHARGE_AREA_ID);
  area?.scrollIntoView({ block: "center", behavior: "smooth" });
  area?.querySelector("input")?.focus({ preventScroll: true });
}

// 결제 완료·잔액 부족은 시안의 "취소"를 일부러 두지 않음(빅버드 머니 알럿과 같은 규칙).
export function PaymentDialogs({
  dialog,
  onClose,
  onGoToStep,
  onLeaveToDetail,
  onCompleteDemo,
  isBusy,
  onApprovalRequested,
}: PaymentDialogsProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();

  function handleConfirm() {
    // 데모 작성 완료는 요청이 끝날 때까지 알럿을 열어 둠(결과에 따라 흐름이 닫음).
    if (dialog?.type === "demoConfirm") {
      onCompleteDemo();
      return;
    }
    onClose();
    switch (dialog?.type) {
      case "required":
        onGoToStep(dialog.targetStep);
        return;
      case "insufficientBalance":
        // 알럿이 닫히며 포커스를 되돌린 뒤에 옮김.
        requestAnimationFrame(focusChargeArea);
        return;
      case "completed":
      case "reapprovalCompleted":
        onApprovalRequested?.();
        onLeaveToDetail();
        return;
      case "invalidStartDate":
        onGoToStep("campaign-info");
        return;
      case "subscriptionRequired":
        void navigate(ROUTES.mypageSubscribe);
        return;
    }
  }

  const keyPrefix = dialog ? DIALOG_KEYS[dialog.type] : null;

  return (
    <AlertDialog
      open={dialog !== null}
      onOpenChange={(isOpen) => {
        // 결제·재승인 완료는 확인으로만 닫힘(등록 내역으로 가야 함).
        if (
          !isOpen &&
          dialog?.type !== "completed" &&
          dialog?.type !== "reapprovalCompleted"
        ) {
          onClose();
        }
      }}
    >
      {keyPrefix && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${keyPrefix}.title`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(`${keyPrefix}.description`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {(dialog?.type === "subscriptionRequired" ||
              dialog?.type === "demoConfirm") && (
              <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
            )}
            <AlertDialogAction
              disabled={isBusy}
              onClick={(event) => {
                if (dialog?.type === "demoConfirm") event.preventDefault();
                handleConfirm();
              }}
            >
              {dialog?.type === "subscriptionRequired"
                ? t("payment.dialog.subscriptionRequired.subscribe")
                : tCommon("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
