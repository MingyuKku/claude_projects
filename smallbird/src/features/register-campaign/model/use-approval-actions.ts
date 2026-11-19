import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  CAMPAIGN_REGISTER_STEPS,
  campaignDetailKey,
  cancelCampaignApproval,
  DRAFT_STEP_BY_REGISTER_STEP,
  getCampaignRegisterPath,
  readCampaignPaymentError,
  requestCampaignReapproval,
  toDraftStep,
} from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";

import type { CampaignPolicyAgreements } from "@/entities/campaign";

/** 등록 내역의 알럿. 재승인 미입력은 확인하면 첫 빈 단계(수정 모드)로 감. */
export type ApprovalDialog =
  | { type: "cancelConfirm" }
  | { type: "reapprovalRequested" }
  | { type: "reapprovalRequired"; serverStep: string | null };

/** 서버 단계 경로 이름(`info` · `add-ons` …)을 주소의 단계로 바꿈. 모르는 이름이면 첫 단계. */
function toRegisterStep(serverStep: string | null) {
  const draftStep = toDraftStep(serverStep);
  return (
    CAMPAIGN_REGISTER_STEPS.find(
      (step) =>
        draftStep !== null && DRAFT_STEP_BY_REGISTER_STEP[step] === draftStep,
    ) ?? "campaign-info"
  );
}

/**
 * 등록 내역의 승인 요청 취소·재승인 요청.
 * 취소: 확인 알럿 → 전액 환불·등록 중으로 → 토스트 후 작성 화면 결제 단계로. 재승인: 요청 → 완료 알럿 → 승인 대기로 다시 읽음.
 * 반려하면 서버가 정책 동의를 지워 재승인 요청에 동의가 필요함. 동의가 남아 있으면 그 값으로 바로 요청하고, 아니면 7단계(수정
 * 모드)에서 다시 받도록 안내함(동의는 화면 상태라 여기서 받을 수 없음).
 */
export function useApprovalActions(campaignIdx: number) {
  const { t } = useTranslation("features/register-campaign");
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const [dialog, setDialog] = useState<ApprovalDialog | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const reloadDetail = () => mutate(campaignDetailKey(campaignIdx));

  async function cancelApproval() {
    setIsRequesting(true);
    const [error] = await tryit(cancelCampaignApproval)(campaignIdx);
    setIsRequesting(false);
    setDialog(null);
    if (error) {
      // 그사이 승인됐으면(NOT_CANCELABLE) 새 상태를 보여 줌. 환불 실패는 상태가 그대로라 다시 시도할 수 있음.
      toast.error(t("toast.requestFailed"));
      void reloadDetail();
      return;
    }
    toast.success(t("detail.toast.refunded"));
    void refreshBalance();
    // 작성 화면이 등록 중 상태를 읽어야 열리므로 다시 읽은 뒤 옮김.
    await reloadDetail();
    void navigate(getCampaignRegisterPath(campaignIdx, "payment"), {
      replace: true,
    });
  }

  async function requestReapproval(agreements: CampaignPolicyAgreements) {
    if (!Object.values(agreements).every(Boolean)) {
      setDialog({ type: "reapprovalRequired", serverStep: "policy" });
      return;
    }
    setIsRequesting(true);
    const [error] = await tryit(requestCampaignReapproval)(
      campaignIdx,
      agreements,
    );
    setIsRequesting(false);
    if (!error) {
      setDialog({ type: "reapprovalRequested" });
      return;
    }
    const reason = readCampaignPaymentError(error);
    if (
      reason?.reason === "INCOMPLETE_DRAFT" ||
      reason?.reason === "POLICY_NOT_AGREED"
    ) {
      const serverStep =
        reason.reason === "POLICY_NOT_AGREED"
          ? "policy"
          : (reason.missingSteps[0] ?? null);
      setDialog({ type: "reapprovalRequired", serverStep });
      return;
    }
    toast.error(t("toast.requestFailed"));
    void reloadDetail();
  }

  function confirmDialog() {
    if (dialog?.type === "reapprovalRequested") void reloadDetail();
    if (dialog?.type === "reapprovalRequired") {
      void navigate(
        getCampaignRegisterPath(campaignIdx, toRegisterStep(dialog.serverStep)),
      );
    }
    setDialog(null);
  }

  return {
    dialog,
    isRequesting,
    openCancelConfirm: () => setDialog({ type: "cancelConfirm" }),
    closeDialog: () => setDialog(null),
    confirmDialog,
    cancelApproval,
    requestReapproval,
  };
}
