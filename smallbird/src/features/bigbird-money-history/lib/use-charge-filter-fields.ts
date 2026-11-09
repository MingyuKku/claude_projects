import { CHARGE_STATUSES } from "@/entities/bigbird-money";
import { NARROW_FIELD_WIDTH } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";

import type { FilterField } from "@/shared/components/list-filter";

/** 구분 필터 값. 주소에는 이 값을 쓰고 요청 때 서버 코드로 바꿈(`lib/charge-query.ts`). */
export const CHARGE_TYPE_OPTIONS = ["charge", "withdraw"] as const;

/**
 * 충전/출금 내역 필터(구분·충전 일자·입금 상태. 결제 수단은 무통장 입금뿐이라 두지 않고 검색창도 없음).
 * 서버가 조건 동시 적용(AND)·기간·구분·상태 코드를 지원해(2026-10-30 Swagger) 모두 켬.
 */
export function useChargeFilterFields(): FilterField[] {
  const { t } = useTranslation("features/bigbird-money-history");

  return [
    {
      type: "select",
      id: "type",
      width: NARROW_FIELD_WIDTH,
      label: t("charge.filter.type.label"),
      placeholder: t("charge.filter.type.placeholder"),
      options: CHARGE_TYPE_OPTIONS.map((type) => ({
        value: type,
        label: t(`charge.filter.type.option.${type}`),
      })),
    },
    {
      type: "date",
      id: "date",
      label: t("charge.filter.date.label"),
      placeholder: t("charge.filter.date.placeholder"),
    },
    {
      type: "select",
      id: "status",
      width: NARROW_FIELD_WIDTH,
      label: t("charge.filter.status.label"),
      placeholder: t("charge.filter.status.placeholder"),
      options: CHARGE_STATUSES.map((status) => ({
        value: status,
        label: t(`charge.filter.status.option.${status}`),
      })),
    },
  ];
}
