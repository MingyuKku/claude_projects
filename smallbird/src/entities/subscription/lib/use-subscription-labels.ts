import { useTranslation } from "@/shared/i18n";

import { toPaymentMethod } from "../model/codes";

import type { SubscriptionProductType } from "../model/codes";

/** 상품 유형 코드의 표시 이름(모집형·PICK형 등). */
export function useProductTypeLabel() {
  const { t } = useTranslation("entities/subscription");
  return (type: SubscriptionProductType) => t(`productType.${type}`);
}

/** 결제 수단 서버 값의 표시 이름. 모르는 값은 서버 값을 그대로, 없으면 "-". */
export function usePaymentMethodLabel() {
  const { t } = useTranslation("entities/subscription");
  return (serverValue: string) => {
    if (!serverValue) return "-";
    const method = toPaymentMethod(serverValue);
    return method ? t(`paymentMethod.${method}`) : serverValue;
  };
}
