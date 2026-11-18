import { useTranslation } from "@/shared/i18n";

import { toPaymentMethod } from "../model/codes";

import type {
  BillingPeriod,
  CardKind,
  SubscriptionProductType,
} from "../model/codes";

/** 상품 유형 코드의 표시 이름(모집형·PICK형 등). */
export function useProductTypeLabel() {
  const { t } = useTranslation("entities/subscription");
  return (type: SubscriptionProductType) => t(`productType.${type}`);
}

/**
 * 구독 상품 이름("월 구독 상품_모집형"). 상품 유형·결제 주기 코드로 언어별 이름을 만들고,
 * 둘 중 하나라도 모르면 서버가 만든 이름(한국어)을 그대로 돌려줌.
 */
export function useSubscriptionProductName() {
  const { t } = useTranslation("entities/subscription");
  return (
    type: SubscriptionProductType | null,
    period: BillingPeriod | null,
    serverName: string,
  ) => {
    if (!type || !period) return serverName;
    return t(`productName.${period}`, { type: t(`productType.${type}`) });
  };
}

/**
 * 결제 수단 서버 값의 표시 이름. 모르는 값은 서버 값을 그대로, 없으면 "-".
 * 체크카드로 결제한 일시불(`card`)은 "체크카드"로 보임. 체크카드 할부는 서버가 막아 오지 않고, 신용·종류 모름은 기존 문구 그대로.
 */
export function usePaymentMethodLabel() {
  const { t } = useTranslation("entities/subscription");
  return (serverValue: string, cardKind?: CardKind | null) => {
    if (!serverValue) return "-";
    const method = toPaymentMethod(serverValue);
    if (!method) return serverValue;
    if (method === "card" && cardKind === "debit") {
      return t("paymentMethod.cardDebit");
    }
    return t(`paymentMethod.${method}`);
  };
}
