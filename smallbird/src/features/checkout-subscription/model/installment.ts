import type { BillingCard, BillingPeriod } from "@/entities/subscription";

/** 일시불은 개월 수 0으로 나타냄. */
export const LUMP_SUM = 0;
// 서버는 연간 결제에만 2~12개월 할부를 받고, 그 밖의 값(없음·0·1)은 일시불로 봄(스펙 §7 B-4).
const MIN_INSTALLMENT_MONTHS = 2;
const MAX_INSTALLMENT_MONTHS = 12;

/** 할부 선택 목록: 일시불, 2~12개월. 시안의 "1개월"은 서버가 일시불로 처리하는 값이라 뺌. */
export const INSTALLMENT_OPTIONS = [
  LUMP_SUM,
  ...Array.from(
    { length: MAX_INSTALLMENT_MONTHS - MIN_INSTALLMENT_MONTHS + 1 },
    (_, index) => MIN_INSTALLMENT_MONTHS + index,
  ),
];

/** 연간 결제이고 결제 카드가 체크카드가 아닐 때만 할부를 고를 수 있음(체크카드는 서버가 거절함). 카드 종류를 모르면(null) 막지 않음. */
export function canChooseInstallment(
  period: BillingPeriod,
  card: BillingCard | undefined,
) {
  return period === "yearly" && card !== undefined && card.cardKind !== "debit";
}

/** 서버에 보낼 할부 개월 수. 일시불이면 필드를 보내지 않음. */
export function toInstallmentMonths(months: number) {
  return months >= MIN_INSTALLMENT_MONTHS ? months : undefined;
}
