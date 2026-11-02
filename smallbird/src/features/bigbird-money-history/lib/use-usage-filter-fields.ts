import { useTranslation } from "@/shared/i18n";

import type { FilterField } from "@/shared/components/list-filter";

/**
 * 사용 내역 필터. 서버가 기간 검색·조건 동시 적용과 선택지(캠페인 명·사용 내역) 조회를 지원하기 전까지
 * 모두 비활성으로 둠(사용자 결정 2026-10-23, docs/mypage-api.md §4-16).
 */
export function useUsageFilterFields(): FilterField[] {
  const { t } = useTranslation("features/bigbird-money-history");

  return [
    {
      type: "date",
      id: "date",
      label: t("usage.filter.date.label"),
      placeholder: t("usage.filter.date.placeholder"),
      isDisabled: true,
    },
    {
      type: "select",
      id: "campaign",
      label: t("usage.filter.campaign.label"),
      placeholder: t("usage.filter.campaign.placeholder"),
      options: [],
      isDisabled: true,
    },
    {
      type: "select",
      id: "usage",
      label: t("usage.filter.usage.label"),
      placeholder: t("usage.filter.usage.placeholder"),
      options: [],
      isDisabled: true,
    },
  ];
}
