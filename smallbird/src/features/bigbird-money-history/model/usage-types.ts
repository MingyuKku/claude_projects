/** 구분 배지로 보이는 사용 유형 코드. 서버 `USE`·`REFUND`·`CHARGE`·`WITHDRAWAL`. */
export const USAGE_TYPES = ["use", "refund", "charge", "withdraw"] as const;

export type UsageType = (typeof USAGE_TYPES)[number];

export const SERVER_USAGE_TYPE = {
  use: "USE",
  refund: "REFUND",
  charge: "CHARGE",
  withdraw: "WITHDRAWAL",
} as const satisfies Record<UsageType, string>;

/** 캠페인과 무관한 사용 유형. 캠페인 명·유형·코드·사용 내역·계약 대상 칸을 빈칸으로 둠(시안 `11290:161266`·`11290:161503`). */
export const NON_CAMPAIGN_USAGE_TYPES: readonly UsageType[] = [
  "charge",
  "withdraw",
];

/** 캠페인 유형 코드. 서버 `recruit`(모집형)·`pick`(PICK형). */
export const CAMPAIGN_TYPES = ["recruit", "pick"] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

/** 사용 내역(세부 분류) 코드. 화면 코드와 서버 코드의 짝은 `SERVER_USAGE_DETAIL`. */
export const USAGE_DETAILS = [
  "contractPick",
  "contractRecruit",
  "aiManuscriptConfirm",
  "aiPostingGuide",
] as const;

export type UsageDetail = (typeof USAGE_DETAILS)[number];

export const SERVER_USAGE_DETAIL = {
  contractPick: "INFLUENCER_CONTRACT_PICK",
  contractRecruit: "INFLUENCER_CONTRACT_RECRUIT",
  aiManuscriptConfirm: "AI_MANUSCRIPT_CONFIRM",
  aiPostingGuide: "AI_POSTING_GUIDE",
} as const satisfies Record<UsageDetail, string>;

export interface UsageRecord {
  /** 서버가 주는 사용 내역 코드. 사용·환급·충전·출금 모두 고유해 그대로 목록 키이자 상세 보기 주소(`?id=`)로 씀. */
  id: string;
  /** 구분. 모르는 서버 값이면 null이라 `typeText`를 그대로 배지 글자로 보임. */
  type: UsageType | null;
  typeText: string;
  /** 사용 일시(충전은 입금 완료, 출금은 처리 시각). 서버 형식을 읽지 못하면 null이고 원문은 `usedAtText`. */
  usedAt: Date | null;
  usedAtText: string;
  campaignName: string;
  campaignCode: string;
  /** 캠페인 유형 코드. 모르는 서버 값이면 null이라 `campaignTypeText`를 그대로 보임. */
  campaignType: CampaignType | null;
  /** 코드로 바꾸지 못할 때 보일 서버 값. 값이 없으면 "-", 충전·출금은 빈 문자열. */
  campaignTypeText: string;
  /** 사용 내역 코드. 모르는 서버 값이나 코드가 없는 옛 건은 null이라 `usageDetailText`를 그대로 보임. */
  usageDetail: UsageDetail | null;
  /** 코드로 바꾸지 못할 때 보일 서버 문구. 값이 없으면 "-", 충전·출금은 빈 문자열. */
  usageDetailText: string;
  /** 사용 금액(서버 부호 그대로: 차감은 음수, 반환·충전은 양수). 값이 없으면 null. */
  amount: number | null;
  /** 사용 후 잔액. 값이 없으면 null. */
  remainingAmount: number | null;
  /** 계약 대상(인플루언서). 모집형·부가 서비스·충전·출금처럼 대상이 없으면 null. */
  contractTarget: { name: string; influencerId: string } | null;
}

export interface UsageListViewModel {
  records: UsageRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/** 사용 내역 요청 조건. 필터는 서버에서 함께 걸림(AND). 값이 없으면 보내지 않음. 검색어는 대상이 정해지기 전(Q-8)이라 보내지 않음. */
export interface UsageQuery {
  page: number;
  entrySize: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  campaignIdx?: number;
  usageDetailCode?: string;
}
