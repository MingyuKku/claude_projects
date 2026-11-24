import { useNavigate } from "react-router";

import { getCampaignDetailPath } from "@/entities/campaign";

import { useRegisterWizardStore } from "./wizard-context";

/**
 * 수정 모드에서 등록 내역(기본정보)으로 돌아감. 저장은 떠날 때 저장(useSaveBeforeLeave)이 맡아, 실패하면 머물고 실패 토스트를 띄움.
 * 기록을 쌓지 않아(replace) 기본정보와 단계를 몇 번 오가도 헤더 "<"는 들어온 화면(현황)으로 한 번에 돌아감.
 */
export function useLeaveToOverview() {
  const navigate = useNavigate();
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);

  return () =>
    void navigate(getCampaignDetailPath(campaignIdx), { replace: true });
}
