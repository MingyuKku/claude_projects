import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { useMoneyFormat } from "../lib/use-money-format";
import { useUsageLabels } from "../lib/use-usage-labels";
import { NON_CAMPAIGN_USAGE_TYPES } from "../model/usage-types";
import { DetailPanel } from "./DetailPanel";
import { UsageTypeBadge } from "./UsageTypeBadge";

import type { UsageRecord } from "../model/usage-types";

interface UsageDetailProps {
  record: UsageRecord;
  onClose: () => void;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton?: boolean;
}

function ContractTarget({ record }: { record: UsageRecord }) {
  const { contractTarget } = record;
  // 충전·출금은 캠페인과 무관해 다른 캠페인 칸처럼 빈칸. 사용·환급인데 대상이 없으면(모집형·부가 서비스) "-".
  if (!contractTarget)
    return record.type && NON_CAMPAIGN_USAGE_TYPES.includes(record.type)
      ? ""
      : "-";
  const handle = contractTarget.influencerId.replace(/^@?/, "@");
  return (
    <span className="flex flex-col">
      <span>{contractTarget.name || "-"}</span>
      {contractTarget.influencerId && (
        <span className="text-muted-foreground">{handle}</span>
      )}
    </span>
  );
}

// 사용 상세 보기(사용 11290:161387·환급 11290:161151·충전 11290:161266·출금 11290:161503): 구분(배지)·{유형} 일자·캠페인 명·캠페인 유형·
// 캠페인 코드·사용 내역·{유형} 금액·사용 후 잔액. 하단 버튼 없음. 일자·금액 라벨은 유형별이고 모르는 유형은 사용 라벨.
// 금액은 목록과 달리 검정 w600에 음수만 "-"(시안).
// "계약 대상"(사용 내역과 사용 금액 사이)은 이름 + 아래 줄 "@아이디". 대상이 없으면 "-", 충전·출금은 빈칸(스펙 §7 D-2).
export function UsageDetail({
  record,
  onClose,
  hasBackButton,
}: UsageDetailProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const labels = useUsageLabels();
  const labelType = record.type ?? "use";

  return (
    <DetailPanel
      title={t("usage.detail.title")}
      hasBackButton={hasBackButton}
      onClose={onClose}
      rows={[
        {
          key: "type",
          label: t("usage.detail.type"),
          value: <UsageTypeBadge record={record} />,
        },
        {
          key: "date",
          label: t(`usage.detail.date.${labelType}`),
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
          value: labels.campaignType(record),
        },
        {
          key: "campaignCode",
          label: t("usage.detail.campaignCode"),
          value: record.campaignCode,
        },
        {
          key: "usage",
          label: t("usage.detail.usage"),
          value: labels.usageDetail(record),
        },
        {
          key: "contractTarget",
          label: t("usage.detail.contractTarget"),
          value: <ContractTarget record={record} />,
        },
        {
          key: "amount",
          label: t(`usage.detail.amount.${labelType}`),
          value: (
            <span className={cn(record.amount !== null && "font-semibold")}>
              {formatWon(record.amount)}
            </span>
          ),
        },
        {
          key: "remaining",
          label: t("usage.detail.remaining"),
          value: formatWon(record.remainingAmount),
        },
      ]}
    />
  );
}
