import { useTranslation } from "@/shared/i18n";

import type { CampaignTypeFilter } from "../model/codes";

/** 서비스+상품 유형의 표시 문구. 필터 선택지처럼 컴포넌트 밖에서 문구가 필요한 화면이 씀. */
export function useCampaignTypeLabel() {
  const { t } = useTranslation("entities/campaign");

  return (type: CampaignTypeFilter) => t(`type.${type}`);
}
