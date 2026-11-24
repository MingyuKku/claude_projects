import { Navigate, useOutletContext, useParams } from "react-router";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  CAMPAIGN_STEP_PARAM,
  getCampaignRegisterPath,
  parseCampaignIdx,
  isUnreadableCampaignError,
  useCampaignDetail,
} from "@/entities/campaign";
import {
  ChargeInline,
  PaymentRequestedDialog,
  usePaymentReturn,
} from "@/features/charge-bigbird-money";
import { requestPushPermissionAndRegister } from "@/features/enable-web-push";
import {
  RegisterStepSidebar,
  RegisterWizardContent,
  RegisterWizardProvider,
} from "@/features/register-campaign";
import { NotFoundError } from "@/shared/lib";

import { getRegisterRedirectPath } from "../model/entry";
import { RegisterComingSoon } from "./RegisterComingSoon";
import { RegisterShell } from "./RegisterShell";

import type { SessionViewModel } from "@/entities/session";

// `/campaign/register/:campaignIdx`: 등록 중 캠페인을 이어 씀. 승인 요청 이후 상태·작성을 마친 데모는 등록 내역으로 보냄.
// 모집형(과 서비스 유형을 모르는 v2 캠페인)은 모집형 갱신 전이라 준비 중.
export function CampaignRegisterPage() {
  const { campaignIdx: campaignIdxParam } = useParams();
  const campaignIdx = parseCampaignIdx(campaignIdxParam);
  const session = useOutletContext<SessionViewModel>();
  const { detail, error } = useCampaignDetail(campaignIdx);
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const paymentReturn = usePaymentReturn({
    onReturned: refreshBalance,
    nextSearchParams: { [CAMPAIGN_STEP_PARAM]: "payment" },
  });

  if (campaignIdx === null) throw new NotFoundError();
  if (error) {
    if (isUnreadableCampaignError(error)) throw new NotFoundError();
    throw error;
  }

  const redirectPath = detail ? getRegisterRedirectPath(detail) : null;
  if (redirectPath) return <Navigate to={redirectPath} replace />;

  // 마법사는 열 때 주소의 단계를 고쳐 쓰는데, 결제 서버가 붙인 쿼리가 남은 채로 쓰면 지운 쿼리가 되살아남.
  if (!detail || paymentReturn.isClearingQuery) return <RegisterShell />;
  if (detail.serviceType !== "PICK") {
    return (
      <RegisterShell>
        <RegisterComingSoon />
      </RegisterShell>
    );
  }

  return (
    <RegisterWizardProvider key={detail.campaignIdx} detail={detail}>
      <RegisterShell isDemo={detail.isDemo} sidebar={<RegisterStepSidebar />}>
        <RegisterWizardContent
          // 승인 결과를 기다리는 순간(결제·재승인 완료 알럿 확인)에 브라우저 알림 권한을 물음. Sub ID는 알림을 받지 않음.
          onApprovalRequested={
            session.authority === "SUB"
              ? undefined
              : () => void requestPushPermissionAndRegister()
          }
          // 결제 서버가 복귀 주소 뒤에 `?isPaid=…`를 이어 붙여서 쿼리 없이 보냄.
          chargeSlot={
            <ChargeInline
              returnPath={getCampaignRegisterPath(detail.campaignIdx)}
            />
          }
        />
      </RegisterShell>
      <PaymentRequestedDialog
        open={paymentReturn.isRequested}
        onConfirm={paymentReturn.closeAlert}
      />
    </RegisterWizardProvider>
  );
}
