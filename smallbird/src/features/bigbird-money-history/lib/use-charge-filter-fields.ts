import { CHARGE_STATUSES } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";

import type { FilterField } from "@/shared/components/list-filter";

/** 서버 입금 상태 값(필터 요청도 같은 한글 값). */
const SERVER_STATUS_VALUE = {
  paid: "결제완료",
  pending: "대기중",
  canceled: "결제취소",
} as const;

/**
 * 충전 내역 필터(충전 일자·입금 상태. 결제 수단은 무통장 입금뿐이라 두지 않고 검색창도 없음).
 * 서버가 기간 검색·조건 동시 적용을 지원하기 전까지 모두 비활성으로 둠(사용자 결정 2026-10-23, docs/mypage-api.md §4-16).
 */
export function useChargeFilterFields(): FilterField[] {
  const { t } = useTranslation("features/bigbird-money-history");

  return [
    {
      type: "date",
      id: "date",
      label: t("charge.filter.date.label"),
      placeholder: t("charge.filter.date.placeholder"),
      isDisabled: true,
    },
    {
      type: "select",
      id: "status",
      label: t("charge.filter.status.label"),
      placeholder: t("charge.filter.status.placeholder"),
      options: CHARGE_STATUSES.map((status) => ({
        value: SERVER_STATUS_VALUE[status],
        label: t(`charge.filter.status.option.${status}`),
      })),
      isDisabled: true,
    },
  ];
}
