import type {
  CampaignProductType,
  CampaignServiceType,
  CampaignStage,
  CampaignTypeFilter,
} from "./codes";
import type { CampaignPlatform, CampaignType } from "./input-codes";

export interface CampaignSummary {
  id: string;
  campaignIdx: number;
  name: string;
  productName: string | null;
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

/** 이전 캠페인 불러오기 목록 조건. 같은 서비스·상품 유형만, 지금 캠페인은 뺌. */
export interface CopySourceQuery {
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  excludeCampaignIdx: number;
  keyword: string;
}

export interface CopySourceCampaign {
  campaignIdx: number;
  /** 입력 전이면 빈 문자열. */
  name: string;
  brandName: string | null;
  /** 모르는 코드(구매리뷰형 등 v2 캠페인)면 null이고 표시는 `rawCampaignType`. */
  campaignType: CampaignType | null;
  rawCampaignType: string | null;
  platform: CampaignPlatform | null;
  /** 등록일 `yyyy-MM-dd`. */
  createdDate: string | null;
}

export interface ProductMiddleCategory {
  idx: number;
  name: string;
}

/** 공구형 상품 카테고리 대분류. 중분류는 대분류에 딸려 있음. */
export interface ProductCategory {
  idx: number;
  name: string;
  children: ProductMiddleCategory[];
}
