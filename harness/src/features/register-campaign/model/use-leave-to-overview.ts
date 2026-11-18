import { useNavigate } from "react-router";

import { getCampaignDetailPath } from "@/entities/campaign";

import { useRegisterWizardStore } from "./wizard-context";

/**
 * 수정 모드에서 등록 내역(기본정보)으로 돌아감. 저장은 떠날 때 저장(useSaveBeforeLeave)이 맡아, 실패하면 머물고 실패 토스트를 띄움.
 */
export function useLeaveToOverview() {
  const navigate = useNavigate();
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);

  return () => void navigate(getCampaignDetailPath(campaignIdx));
}
