import type { ChargeStatus } from "@/entities/bigbird-money";

export interface ChargeRecord {
  /** 응답에 식별자가 없어 지금 쪽 안의 순서(0부터)로 씀. 거래 상세 주소(`?id=`)가 이 값이고 쪽 쿼리와 함께 가리킴. */
  id: string;
  /** 충전 요청(입금 요청) 일시. 읽지 못하면 null이고 원문은 `requestedAtText`. */
  requestedAt: Date | null;
  requestedAtText: string;
  /** 충전 요청 금액. 값이 없으면 null. */
  amount: number | null;
  /** 서버 결제 수단 값(`VBank` 등). 없으면 빈 문자열. */
  payMethod: string;
  /** 입금 상태 코드. 모르는 서버 값이면 null이라 `statusText`를 그대로 보임. */
  status: ChargeStatus | null;
  statusText: string;
  bankName: string;
  accountNumber: string;
  /** 입금 완료(승인) 일시. 미입금(`N/A`)이면 null이고 원문은 "-". */
  depositedAt: Date | null;
  depositedAtText: string;
  /** 거래명세서 주소. 결제 완료이고 안전한 주소일 때만 값이 있음. */
  receiptUrl: string | null;
}

export interface ChargeListViewModel {
  records: ChargeRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
}
