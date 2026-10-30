import { useTranslation } from "@/shared/i18n";

import { useMoneyFormat } from "../lib/use-money-format";
import { DetailPanel } from "./DetailPanel";
import { UsageAmount } from "./UsageAmount";

import type { UsageRecord } from "../model/usage-types";

interface UsageDetailProps {
  record: UsageRecord;
  onClose: () => void;
  /** TAB은 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton?: boolean;
}

// 사용 상세 보기: 사용 일자·캠페인 명·캠페인 유형·캠페인 코드·사용 내역·사용 금액·사용 후 잔액. 하단 버튼 없음.
export function UsageDetail({
  record,
  onClose,
  hasBackButton,
}: UsageDetailProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();

  return (
    <DetailPanel
      title={t("usage.detail.title")}
      hasBackButton={hasBackButton}
      onClose={onClose}
      rows={[
        {
          key: "usedAt",
          label: t("usage.detail.usedAt"),
          value: formatDateTime(record.usedAt, record.usedAtText),
        },
        {
          key: "campaignName",
          label: t("usage.detail.campaignName"),
          value: record.campaignName,
        },
        {
          key: "campaignType",
          label: t("usage.detail.campaignType"),
          value: record.campaignType,
        },
        {
          key: "campaignCode",
          label: t("usage.detail.campaignCode"),
          value: record.campaignCode,
        },
        {
          key: "usage",
          label: t("usage.detail.usage"),
          value: record.usageLabel,
        },
        {
          key: "amount",
          label: t("usage.detail.amount"),
          value: (
            <UsageAmount amount={record.amount} className="font-semibold" />
          ),
        },
        {
          key: "remaining",
          label: t("usage.detail.remaining"),
          value: (
            <span className="font-semibold">
              {formatWon(record.remainingAmount)}
            </span>
          ),
        },
      ]}
    />
  );
}
