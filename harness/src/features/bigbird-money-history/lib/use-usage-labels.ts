import { useTranslation } from "@/shared/i18n";

import type { UsageRecord } from "../model/usage-types";

/** 사용 내역 항목의 코드를 번역 문구로 바꿈. 모르는 서버 값(코드가 없는 옛 건 포함)은 서버 값을 그대로 보임. */
export function useUsageLabels() {
  const { t } = useTranslation("features/bigbird-money-history");

  return {
    campaignType: (record: UsageRecord) =>
      record.campaignType
        ? t(`usage.campaignType.${record.campaignType}`)
        : record.campaignTypeText,
    usageDetail: (record: UsageRecord) =>
      record.usageDetail
        ? t(`usage.usageDetail.${record.usageDetail}`)
        : record.usageDetailText,
  };
}
