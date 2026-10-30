export interface UsageRecord {
  /** 응답에 식별자가 없어 지금 쪽 안의 순서(0부터)로 씀. 상세 보기 주소(`?id=`)가 이 값이고 쪽 쿼리와 함께 가리킴. */
  id: string;
  /** 사용 일시. 서버 형식을 읽지 못하면 null이고 원문은 `usedAtText`. */
  usedAt: Date | null;
  usedAtText: string;
  campaignName: string;
  campaignCode: string;
  /** 캠페인 유형(서버 서비스명). 값이 없으면 "-". */
  campaignType: string;
  /** 사용 내역(세부 분류). 없으면 사용 유형(충전·사용·환불·환급), 그것도 없으면 "-". */
  usageLabel: string;
  /** 사용 금액. 차감은 음수, 반환은 양수. 값이 없으면 null. */
  amount: number | null;
  /** 사용 후 잔액. 값이 없으면 null. */
  remainingAmount: number | null;
}

export interface UsageListViewModel {
  records: UsageRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
}
