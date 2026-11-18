import {
  CAMPAIGN_PAGE_SIZE,
  toCampaignStage,
  toCampaignTypeFilter,
} from "../model/codes";

import type { CampaignListResponse } from "../model/schema";
import type { CampaignPage } from "../model/types";

/** 응답을 화면 모델로 바꿈. 쪽 수는 서버가 준 전체 건수로 계산함. */
export function transformCampaignList(
  response: CampaignListResponse,
): CampaignPage {
  const entrySize =
    response.entrySize > 0 ? response.entrySize : CAMPAIGN_PAGE_SIZE;
  return {
    records: response.list.map((item) => ({
      id: String(item.campaignIdx),
      campaignIdx: item.campaignIdx,
      name: item.name ?? "",
      productName: item.productName || null,
      thumbnailUrl: item.thumbnailUrl || null,
      stage: toCampaignStage(item.status),
      rawStatus: item.status,
      type: toCampaignTypeFilter(item.serviceType, item.productType),
      rawTypeText: [item.serviceType, item.productType]
        .filter(Boolean)
        .join(" "),
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      isDemo: item.demo,
      isDemoCompleted: item.demoCompleted,
    })),
    totalCount: response.count,
    totalPages: Math.ceil(response.count / entrySize),
  };
}
