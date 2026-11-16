import { Navigate, useParams } from "react-router";

import { parseCampaignIdx, useCampaignDetail } from "@/entities/campaign";
import {
  RegisterStepSidebar,
  RegisterWizardContent,
  RegisterWizardProvider,
} from "@/features/register-campaign";
import { isApiError } from "@/shared/api";
import { NotFoundError } from "@/shared/lib";

import { getRegisterRedirectPath } from "../model/entry";
import { RegisterComingSoon } from "./RegisterComingSoon";
import { RegisterShell } from "./RegisterShell";

const NOT_FOUND_STATUS = 404;

// `/campaign/register/:campaignIdx`: 등록 중 캠페인을 이어 씀. 승인 요청 이후 상태·작성을 마친 데모는 등록 내역으로 보냄.
// 모집형(과 서비스 유형을 모르는 v2 캠페인)은 모집형 갱신 전이라 준비 중.
export function CampaignRegisterPage() {
  const { campaignIdx: campaignIdxParam } = useParams();
  const campaignIdx = parseCampaignIdx(campaignIdxParam);
  const { detail, error } = useCampaignDetail(campaignIdx);

  if (campaignIdx === null) throw new NotFoundError();
  if (error) {
    if (isApiError(error) && error.status === NOT_FOUND_STATUS) {
      throw new NotFoundError();
    }
    throw error;
  }

  const redirectPath = detail ? getRegisterRedirectPath(detail) : null;
  if (redirectPath) return <Navigate to={redirectPath} replace />;

  if (!detail) return <RegisterShell />;
  if (detail.serviceType !== "PICK") {
    return (
      <RegisterShell>
        <RegisterComingSoon />
      </RegisterShell>
    );
  }

  return (
    <RegisterWizardProvider key={detail.campaignIdx} detail={detail}>
      <RegisterShell sidebar={<RegisterStepSidebar />}>
        <RegisterWizardContent />
      </RegisterShell>
    </RegisterWizardProvider>
  );
}
