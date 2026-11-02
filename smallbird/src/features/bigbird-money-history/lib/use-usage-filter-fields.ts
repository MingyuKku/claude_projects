import { useTranslation } from "@/shared/i18n";

import { useUsageFilterOptions } from "../api/use-usage-filter-options";
import { USAGE_TYPES } from "../model/usage-types";
import { toUsageDetail } from "./transform-usage";

import type { FilterField } from "@/shared/components/list-filter";

/**
 * 사용 내역 필터(구분·사용 일자·캠페인 명·사용 내역). 서버가 조건 동시 적용(AND)·기간·구분·캠페인·사용 내역 코드를 지원해
 * (2026-10-30 14:52 Stage) 모두 켬. 구분 값은 주소에 화면 코드를 쓰고 요청 때 서버 코드로 바꿈(`lib/usage-query.ts`).
 * 캠페인 명(값은 `campaignIdx`)과 사용 내역(값은 서버 코드 그대로)은 서버 선택지이고, 불러오기 전이나 실패하거나 없으면 비활성.
 * 사용 내역은 번역이 있는 코드면 번역을, 없으면 서버 `name`을 보임.
 */
export function useUsageFilterFields(): FilterField[] {
  const { t } = useTranslation("features/bigbird-money-history");
  const { campaigns, usageDetails } = useUsageFilterOptions();

  return [
    {
      type: "select",
      id: "type",
      label: t("usage.filter.type.label"),
      placeholder: t("usage.filter.type.placeholder"),
      options: USAGE_TYPES.map((type) => ({
        value: type,
        label: t(`usage.filter.type.option.${type}`),
      })),
    },
    {
      type: "date",
      id: "date",
      label: t("usage.filter.date.label"),
      placeholder: t("usage.filter.date.placeholder"),
    },
    {
      type: "select",
      id: "campaign",
      label: t("usage.filter.campaign.label"),
      placeholder: t("usage.filter.campaign.placeholder"),
      options: campaigns.map(({ campaignIdx, campaignName }) => ({
        value: String(campaignIdx),
        label: campaignName,
      })),
      isDisabled: campaigns.length === 0,
    },
    {
      type: "select",
      id: "usage",
      label: t("usage.filter.usage.label"),
      placeholder: t("usage.filter.usage.placeholder"),
      options: usageDetails.map(({ code, name }) => {
        const detail = toUsageDetail(code);
        return {
          value: code,
          label: detail ? t(`usage.usageDetail.${detail}`) : name,
        };
      }),
      isDisabled: usageDetails.length === 0,
    },
  ];
}
