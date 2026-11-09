import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  usePaymentMethodLabel,
} from "@/entities/subscription";
import {
  DEFAULT_FIELD_WIDTH,
  NARROW_FIELD_WIDTH,
} from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";

import { PAYMENT_ITEMS } from "../model/constants";

import type { FilterField } from "@/shared/components/list-filter";

/**
 * 결제 내역 필터(결제 일자·결제 내역·결제 수단·결제 상태). 값은 서버 코드(스펙 §7 B-2).
 * 결제 내역은 표의 "결제 내역" 열(상품명)을 결제 주기 × 상품 유형 조합(월·연 × PICK형·모집형)으로 거름.
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
      id: "item",
      label: t("filter.item.label"),
      placeholder: t("filter.item.placeholder"),
      // 시안(11755:97590): 결제 내역만 222px(기본 폭)이고 다른 선택은 140px.
      width: DEFAULT_FIELD_WIDTH,
      options: PAYMENT_ITEMS.map((item) => ({
        value: item.value,
        label: t(`filter.item.option.${item.value}`),
      })),
    },
    {
      type: "select",
      id: "method",
      width: NARROW_FIELD_WIDTH,
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
      width: NARROW_FIELD_WIDTH,
      label: t("filter.status.label"),
      placeholder: t("filter.status.placeholder"),
      options: PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    },
  ];
}
