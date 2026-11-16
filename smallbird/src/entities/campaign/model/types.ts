import type { CampaignStage, CampaignTypeFilter } from "./codes";

export interface CampaignSummary {
  id: string;
  campaignIdx: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  /** 모르는 코드면 null이고 배지는 `rawStatus`를 그대로 보임. */
  stage: CampaignStage | null;
  rawStatus: string;
  /** 모르는 서비스·상품 코드면 null이고 표시는 `rawTypeText`. */
  type: CampaignTypeFilter | null;
  rawTypeText: string;
  startDate: string | null;
  endDate: string | null;
  isDemo: boolean;
  isDemoCompleted: boolean;
}

export interface CampaignPage {
  records: CampaignSummary[];
  totalCount: number;
  totalPages: number;
}

/** 현황 목록 조건. `statuses`가 비면 전체. */
export interface CampaignListQuery {
  statuses: readonly CampaignStage[];
  type: CampaignTypeFilter | null;
  keyword: string;
  page: number;
}
