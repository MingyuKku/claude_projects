import { useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";
import { getStepsBackTo } from "@/shared/lib";

import { useCampaignStatusReturnStore } from "./status-return-store";

/**
 * 등록·진행 화면의 헤더 "<": 늘 캠페인 현황으로 감. 이 탭에서 지나온 현황 기록이 있으면 그 기록으로 되돌아감
 * 브라우저 뒤로가기처럼 탭·검색과 이어 읽은 목록·스크롤 위치가 그대로 돌아오고, 없으면(주소로 바로 들어옴·새로고침) 기억한 쿼리로 새로 오픈.
 */
export function useBackToCampaignStatus() {
  const navigate = useNavigate();
  const search = useCampaignStatusReturnStore((state) => state.search);
  const entryKey = useCampaignStatusReturnStore((state) => state.entryKey);

  return () => {
    const stepsBack = entryKey === null ? null : getStepsBackTo(entryKey);
    if (stepsBack !== null) {
      void navigate(-stepsBack);
      return;
    }
    void navigate(`${ROUTES.campaign}${search}`);
  };
}
