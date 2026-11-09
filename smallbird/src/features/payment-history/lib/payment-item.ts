import { PAYMENT_ITEMS } from "../model/constants";

/** 필터 값(`monthly_pick`)을 서버 조건(결제 주기·상품 유형)으로 나눔. 선택지에 없거나 비면 조건 없음. */
export function toPaymentItemQuery(value: string | undefined) {
  const item = PAYMENT_ITEMS.find((candidate) => candidate.value === value);
  return {
    billingPeriod: item?.billingPeriod,
    productType: item?.productType,
  };
}
