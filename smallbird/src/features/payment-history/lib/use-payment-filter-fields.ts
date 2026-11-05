import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  usePaymentMethodLabel,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

import type { FilterField } from "@/shared/components/list-filter";

/**
 * 결제 내역 필터(결제 일자·결제 수단·결제 상태). 값은 서버 코드(스펙 §7 B-2).
 * 구독 결제는 신용카드만이라 결제 수단에 무통장 입금은 없음. 결제 상태는 배지 3종 기준(필터 시안은 환불 2개).
 */
export function usePaymentFilterFields(): FilterField[] {
  const { t } = useTranslation("features/payment-history");
  const paymentMethodLabel = usePaymentMethodLabel();

  return [
    {
      type: "date",
      id: "date",
      label: t("filter.date.label"),
      placeholder: t("filter.date.placeholder"),
    },
    {
      type: "select",
      id: "method",
      label: t("filter.method.label"),
      placeholder: t("filter.method.placeholder"),
      options: PAYMENT_METHODS.map((method) => ({
        value: method,
        label: paymentMethodLabel(method),
      })),
    },
    {
      type: "select",
      id: "status",
      label: t("filter.status.label"),
      placeholder: t("filter.status.placeholder"),
      options: PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    },
  ];
}
