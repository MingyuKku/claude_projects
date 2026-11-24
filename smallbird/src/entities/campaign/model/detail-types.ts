import type {
  CampaignProductType,
  CampaignServiceType,
  CampaignStage,
} from "./codes";
import type { CampaignDraft } from "./draft";

/** 상세 조회(A-3)의 화면 모델. 입력값은 `draft`에, 조회 전용 값은 바깥에 둠. */
export interface CampaignDetail {
  campaignIdx: number;
  campaignCode: string;
  /** 모르는 코드면 null. */
  serviceType: CampaignServiceType | null;
  productType: CampaignProductType | null;
  /** 모르는 코드면 null이고 표시는 `rawStatus`. */
  stage: CampaignStage | null;
  rawStatus: string;
  isDemo: boolean;
  isDemoCompleted: boolean;
  rejectReason: string | null;
  /** 서버가 이어 붙인 브랜드명·로고. 브랜드가 없거나 결제 전 캠페인의 브랜드가 지워졌으면 null. */
  brand: { name: string; logoUrl: string | null } | null;
  /** 서버 캠페인 유형 원문. 모르는 코드라 `draft.info.campaignType`이 null일 때 표시용. */
  rawCampaignType: string | null;
  /** 서버가 정한 종료일(희망 시작일 + 상품 유형별 일수: 브랜드형 30일·공구형 60일). */
  endDate: string | null;
  draft: CampaignDraft;
  /** 결제 전이면 null. */
  payment: { paidAmount: number; paidAt: string } | null;
}
