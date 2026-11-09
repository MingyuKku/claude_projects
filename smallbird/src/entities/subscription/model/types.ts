import type {
  CardKind,
  SubscriptionProductType,
  SubscriptionStatus,
  UsageMetric,
} from "./codes";

/** 구독 탭의 상품 카드 한 장. 가격은 정책이 없어 더미(스펙 §1). */
export interface SubscriptionPlan {
  type: SubscriptionProductType;
  /** false면 "준비중" 카드(라이브형·어플리에이터형). */
  isAvailable: boolean;
  /** "월 ○원" 표기에 쓰는 월 요금(원). */
  monthlyPrice: number;
  /** 연간 결제 총액(원, 할인 반영). 카드의 "연 ○원"과 결제 화면의 결제 금액. */
  yearlyPrice: number;
}

export interface SubscriptionPlanCatalog {
  plans: SubscriptionPlan[];
  /** 연간 결제 할인율(%). */
  yearlyDiscountRate: number;
}

/** 구독 중인 상품 한 건. 해지 예정이어도 멤버십 종료일까지 구독 중으로 봄. */
export interface Subscription {
  id: string;
  type: SubscriptionProductType;
  /** 서버가 만드는 상품 이름(그대로 표시). */
  productName: string;
  /** 멤버십 시작·종료일(`YYYY-MM-DD`). */
  startedAt: string;
  endsAt: string;
  amount: number;
  /** 서버 결제 수단 코드. 표시는 `usePaymentMethodLabel`이 하고, 모르는 값은 서버 값을 그대로 보임. */
  paymentMethod: string;
  /** 가장 최근 결제에 쓴 카드의 종류. 모르거나 없으면 null. */
  cardKind: CardKind | null;
  isCancelScheduled: boolean;
  /** 구독 상태. `paymentFailed`는 정기결제 실패로 이용이 멈춘 구독(스펙 §7 P-17~P-22, 화면은 시안 후). */
  status: SubscriptionStatus;
  /** 다음 재결제 날짜(`YYYY-MM-DD`). 결제 실패(`paymentFailed`)일 때만 있고 그 외 null. */
  nextRetryAt: string | null;
}

export interface UsageQuota {
  used: number;
  remaining: number;
}

/** 브랜드형·공구형 각각의 지표별 누적 건수. */
export type UsageBreakdown = Partial<Record<UsageMetric, number>>;

/** 이용요약 탭의 한 상품 요약. 구독하지 않은 상품은 `isSubscribed: false`이고 나머지 값은 없음. */
export type UsageSummary =
  | { type: SubscriptionProductType; isSubscribed: false }
  | {
      type: SubscriptionProductType;
      isSubscribed: true;
      /** 한도는 상품별. */
      search: UsageQuota;
      proposal: UsageQuota;
      brand: UsageBreakdown;
      groupBuy: UsageBreakdown;
    };

export type UsageGranularity = "monthly" | "daily";

export interface UsageSeriesQuery {
  type: SubscriptionProductType;
  metric: UsageMetric;
  granularity: UsageGranularity;
  year: number;
  /** 일별일 때만 씀(1~12). */
  month?: number;
}

export interface UsageSeriesPoint {
  /** 월별이면 1~12(월), 일별이면 1~31(일). */
  period: number;
  brand: number;
  groupBuy: number;
}

export interface BillingCard {
  id: string;
  /** 카드사명(DB 목록이라 그대로 표시). */
  issuer: string;
  /** 마스킹된 카드번호(`1234-56**-****-***7`). 결제사가 끝 4자리를 주지 않아 서버 값을 그대로 표시. */
  maskedNumber: string;
  isDefault: boolean;
  /** 카드 종류. 모르거나 없으면 null. 지금 화면은 쓰지 않음(카드 목록 시안에 표기 없음). */
  cardKind: CardKind | null;
}

/** 구독 결제 내역 한 건. */
export interface PaymentRecord {
  id: string;
  /** 결제 일시(ISO 8601). */
  paidAt: string;
  /** 결제 내역 이름(서버가 만드는 상품명, 그대로 표시). */
  name: string;
  amount: number;
  /** 서버 결제 수단 값. 코드(`PAYMENT_METHODS`)가 아니면 그대로 표시함. */
  method: string;
  /** 결제에 쓴 카드의 종류. 모르거나 없으면 null. */
  cardKind: CardKind | null;
  /** 서버 결제 상태 값. 코드(`PAYMENT_STATUSES`)가 아니면 그대로 표시함. */
  status: string;
  /** 거래명세서 주소. 결제 완료 건에만 있음. */
  receiptUrl: string | null;
}

/** 구독 결제 내역 한 쪽. 쪽 나누기·필터는 서버가 함. */
export interface PaymentList {
  /** 조건에 맞는 전체 건수. */
  totalCount: number;
  records: PaymentRecord[];
}

/** 결제 내역 요청 조건. 기간은 `YYYY-MM-DD`(양 끝 포함, KST). */
export interface PaymentQuery {
  page: number;
  size: number;
  from?: string;
  to?: string;
  /** 결제 내역 필터의 상품 유형 코드(`recruit`·`pick`). 없으면 전체(Swagger `getPayments`). */
  productType?: string;
  /** 결제 내역 필터의 결제 주기(`monthly`·`yearly`). 서버 파라미터가 아직 없어 백엔드 반영 전에는 걸러지지 않음(스펙 §7 B-6). */
  billingPeriod?: string;
  method?: string;
  status?: string;
}

/** 구독 해지 결과. */
export interface SubscriptionCancelResult {
  subscriptionId: string;
  /** 이 날(`YYYY-MM-DD`)까지는 해지 예정으로 이용. */
  serviceEndAt: string;
}

/** 결제 서버에 보내는 복귀 경로. 서버가 `origin`과 합쳐 주소를 만듦. */
export interface IssuancePaths {
  /** 결제가 끝난 뒤 돌아올 화면. 서버가 뒤에 `?result=…`를 이어 붙이므로 쿼리 없이 보냄. */
  redirectUri: string;
}

/** 결제창으로 보낼 form. `action`으로 `fields`를 POST하면 이니시스 결제 페이지로 이동함. */
export interface IssuanceForm {
  action: string;
  fields: Record<string, string>;
}
