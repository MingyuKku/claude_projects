import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  campaignDetailKey,
  completeCampaignDemo,
  DRAFT_STEP_BY_REGISTER_STEP,
  fetchCampaignDetail,
  getCampaignDetailPath,
  payCampaign,
  readCampaignPaymentError,
  requestCampaignReapproval,
  toDraftStep,
} from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";

import { calculateDraftPayment } from "./payment";
import { getFirstIncompleteStep } from "./step-status";
import { useSaveResultHandler } from "./use-save-result-handler";
import { useDraftSaver, useRegisterWizardStoreApi } from "./wizard-context";

import type { RegisterStepDefinition } from "./steps";
import type { CampaignRegisterStep } from "@/entities/campaign";

/** 결제 단계의 알럿. 필수 미입력은 확인하면 그 단계로 감. */
export type PaymentDialog =
  | { type: "required"; targetStep: CampaignRegisterStep }
  | { type: "insufficientBalance" }
  | { type: "completed" }
  | { type: "failed" }
  | { type: "invalidStartDate" }
  | { type: "subscriptionRequired" }
  /** 데모 "완료" 확인. 확인하면 저장 후 작성 완료 요청. */
  | { type: "demoConfirm" }
  /** 반려 뒤 재승인 요청을 보냄. 확인하면 등록 내역으로 감. */
  | { type: "reapprovalCompleted" };

/** 충전 영역(잔액 부족 알럿의 "확인"이 스크롤·포커스할 곳). */
export const CHARGE_AREA_ID = "register-charge-area";

/** 서버 단계 경로 이름(`info` · `add-ons` …)을 주소의 단계로 바꿈. 모르는 이름이면 null. */
function toRegisterStep(
  serverStep: string,
  steps: readonly RegisterStepDefinition[],
): CampaignRegisterStep | null {
  const draftStep = toDraftStep(serverStep);
  if (draftStep === null) return null;
  return (
    steps.find(({ step }) => DRAFT_STEP_BY_REGISTER_STEP[step] === draftStep)
      ?.step ?? null
  );
}

/**
 * 8단계 "결제하기". 모든 단계 검사 → 잔액 확인 → 저장 → 결제 순서이고,
 * 결과는 알럿으로 알림. 결제 완료가 곧 승인 요청이라 "확인"을 누르면 등록 내역으로 감(기록을 남기지 않음).
 * 반려 뒤 수정 모드의 마지막 단계는 결제 없이 같은 위치에서 재승인을 요청함(`requestReapproval`).
 */
export function usePaymentFlow(steps: readonly RegisterStepDefinition[]) {
  const { t } = useTranslation("features/register-campaign");
  const store = useRegisterWizardStoreApi();
  const saver = useDraftSaver();
  const handleFailedSave = useSaveResultHandler();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { balance, mutate: reloadBalance } = useBigbirdMoneyBalance();
  const [dialog, setDialog] = useState<PaymentDialog | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  function leaveToDetail() {
    const { campaignIdx, allowLeave } = store.getState();
    allowLeave();
    void navigate(getCampaignDetailPath(campaignIdx), { replace: true });
    // 떠난 뒤에 다시 읽음. 먼저 읽으면 작성 화면이 승인 대기 상태를 보고 알럿을 띄운 채 등록 내역으로 넘어감.
    void mutate(campaignDetailKey(campaignIdx));
  }

  async function handleFailedPayment(error: unknown) {
    const paymentError = readCampaignPaymentError(error);
    switch (paymentError?.reason) {
      case "INSUFFICIENT_BALANCE":
        setDialog({ type: "insufficientBalance" });
        return;
      case "INCOMPLETE_DRAFT": {
        const [firstMissing] = paymentError.missingSteps;
        const missingStep =
          firstMissing === undefined
            ? null
            : toRegisterStep(firstMissing, steps);
        const targetStep =
          missingStep ?? getFirstIncompleteStep(steps, store.getState().draft);
        setDialog({ type: "required", targetStep });
        return;
      }
      case "POLICY_NOT_AGREED":
        setDialog({ type: "required", targetStep: "policy" });
        return;
      case "INVALID_START_DATE":
        setDialog({ type: "invalidStartDate" });
        return;
      case "SUBSCRIPTION_REQUIRED":
        setDialog({ type: "subscriptionRequired" });
        return;
      case "ALREADY_PAID": {
        // 다른 곳에서 이미 결제했으면 등록 내역으로, 아니면 다시 결제할 수 있게 실패로 알림.
        const [detailError, detail] = await tryit(fetchCampaignDetail)(
          store.getState().campaignIdx,
        );
        if (!detailError && detail.stage !== "DRAFT") {
          leaveToDetail();
          return;
        }
        setDialog({ type: "failed" });
        return;
      }
      default:
        // 금액은 저장된 초안으로 계산하므로 AMOUNT_CHANGED는 단가가 바뀐 경우뿐이라 실패로 알림.
        setDialog({ type: "failed" });
    }
  }

  async function pay() {
    if (isPaying) return;
    const { draft, serviceType, campaignIdx, isDemo } = store.getState();
    const firstIncomplete = getFirstIncompleteStep(steps, draft);
    if (firstIncomplete !== "payment") {
      setDialog({ type: "required", targetStep: firstIncomplete });
      return;
    }
    if (isDemo) {
      setDialog({ type: "demoConfirm" });
      return;
    }
    const { totalAmount } = calculateDraftPayment(serviceType, draft);
    // 0원이면 잔액과 관계없이 승인 요청으로 보냄. 잔액을 아직 못 읽었으면 서버 검사에 맡김.
    if (totalAmount > 0 && balance && balance.amount < totalAmount) {
      setDialog({ type: "insufficientBalance" });
      return;
    }
    setIsPaying(true);
    const saved = await saver.save();
    if (!saved.ok) {
      setIsPaying(false);
      handleFailedSave(saved);
      return;
    }
    const [error] = await tryit(payCampaign)(campaignIdx, {
      expectedTotalAmount: totalAmount,
      agreements: draft.policy,
    });
    setIsPaying(false);
    if (error) {
      await handleFailedPayment(error);
      return;
    }
    void reloadBalance();
    setDialog({ type: "completed" });
  }

  async function completeDemo() {
    if (isPaying) return;
    setIsPaying(true);
    const saved = await saver.save();
    if (!saved.ok) {
      setIsPaying(false);
      setDialog(null);
      handleFailedSave(saved);
      return;
    }
    const [error] = await tryit(completeCampaignDemo)(
      store.getState().campaignIdx,
    );
    setIsPaying(false);
    setDialog(null);
    const reason = readCampaignPaymentError(error)?.reason;
    if (reason === "INCOMPLETE_DRAFT" || reason === "INVALID_START_DATE") {
      await handleFailedPayment(error);
      return;
    }
    // 이미 작성을 마쳤으면(연타 등) 성공처럼 기본 정보로 감.
    if (error && reason !== "ALREADY_COMPLETED") {
      toast.error(t("toast.requestFailed"));
      return;
    }
    leaveToDetail();
  }

  /**
   * 반려 뒤 수정 모드의 마지막 단계 "재승인 요청". 결제·환불 없이 저장한 뒤 7단계에서 다시 받은 동의와 함께 요청함.
   * 동의가 화면 상태에만 있어 등록 내역으로 나가기 전에 여기서 보냄.
   */
  async function requestReapproval() {
    if (isPaying) return;
    const { draft, campaignIdx } = store.getState();
    const firstIncomplete = getFirstIncompleteStep(steps, draft);
    if (firstIncomplete !== "payment") {
      setDialog({ type: "required", targetStep: firstIncomplete });
      return;
    }
    setIsPaying(true);
    const saved = await saver.save();
    if (!saved.ok) {
      setIsPaying(false);
      handleFailedSave(saved);
      return;
    }
    const [error] = await tryit(requestCampaignReapproval)(
      campaignIdx,
      draft.policy,
    );
    setIsPaying(false);
    if (!error) {
      setDialog({ type: "reapprovalCompleted" });
      return;
    }
    const reason = readCampaignPaymentError(error)?.reason;
    if (
      reason === "INCOMPLETE_DRAFT" ||
      reason === "POLICY_NOT_AGREED" ||
      reason === "INVALID_START_DATE"
    ) {
      await handleFailedPayment(error);
      return;
    }
    toast.error(t("toast.requestFailed"));
    // 그사이 상태가 바뀌었으면(NOT_REQUESTABLE) 등록 내역이 새 상태를 보여 줌.
    if (reason === "NOT_REQUESTABLE") leaveToDetail();
  }

  return {
    dialog,
    isPaying,
    pay,
    requestReapproval,
    completeDemo,
    closeDialog: () => setDialog(null),
    leaveToDetail,
  };
}
