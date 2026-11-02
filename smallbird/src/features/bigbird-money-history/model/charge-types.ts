import type { ChargeStatus } from "@/entities/bigbird-money";

/** 충전/출금 구분. 서버 `CHARGE`·`WITHDRAWAL`. */
export type ChargeType = "charge" | "withdraw";

export interface ChargeRecord {
  /**
   * 화면 식별자 `{구분}-{서버 id}`. 충전과 출금은 서버의 다른 테이블이라 id가 겹칠 수 있어 구분을 붙임.
   * 목록의 React key와 거래 상세 주소(`?id=`)가 이 값.
   */
  id: string;
  /** 서버 id 그대로(구분 없음). 서버 API에 건을 가리킬 때 씀(테스트 입금 처리). */
  serverId: string;
  /** 구분. 모르는 서버 값이면 null이라 `typeText`를 그대로 보임. */
  type: ChargeType | null;
  typeText: string;
  /** 요청 일시(충전은 입금 요청, 출금은 출금 요청). 읽지 못하면 null이고 원문은 `requestedAtText`. */
  requestedAt: Date | null;
  requestedAtText: string;
  /** 금액(부호 없는 양수). 값이 없으면 null. */
  amount: number | null;
  /** 서버 결제 수단 값(`VBANK` 등, 충전만). 없으면 빈 문자열. */
  payMethod: string;
  /** 상태 코드. 모르는 서버 값이면 null이라 `statusText`를 그대로 보임. */
  status: ChargeStatus | null;
  statusText: string;
  bankName: string;
  accountNumber: string;
  /** 입금자 명(충전) / 예금주 명(출금). */
  holderName: string;
  /** 완료 일시(입금 완료·출금 완료). 아직이면 null이고 원문은 "-". */
  completedAt: Date | null;
  completedAtText: string;
  /** 거래명세서 주소. 입금 완료이고 안전한 주소일 때만 값이 있음. */
  receiptUrl: string | null;
}

export interface ChargeListViewModel {
  records: ChargeRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/** 충전/출금 내역 요청 조건. 필터는 서버에서 함께 걸림(AND). 값이 없으면 보내지 않음. */
export interface ChargeQuery {
  page: number;
  entrySize: number;
  type?: "CHARGE" | "WITHDRAWAL";
  status?: string;
  startDate?: string;
  endDate?: string;
}
