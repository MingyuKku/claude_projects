import { FullTextHint } from "@/shared/components/full-text-hint";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useMoneyFormat } from "../lib/use-money-format";
import { useUsageLabels } from "../lib/use-usage-labels";
import { CampaignThumbnail } from "./CampaignThumbnail";
import { UsageAmount } from "./UsageAmount";
import { UsageTypeBadge } from "./UsageTypeBadge";

import type { UsageRecord } from "../model/usage-types";

interface UsageCardListProps {
  records: UsageRecord[];
  onClickDetail: (record: UsageRecord) => void;
}

// 캠페인 유형·캠페인 코드는 상세 보기에만 있음. 캠페인 명 옆에 40px 썸네일(`mainImageUrl`, 없으면 기본 이미지).
// 값이 없는 항목도 행을 숨기지 않고 값만 비워 둠(스펙 §3). TAB은 카드 사이 12px로 2열이고 같은 줄 카드는 높이를 맞춤.
export function UsageCardList({ records, onClickDetail }: UsageCardListProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const labels = useUsageLabels();

  return (
    <ul
      aria-label={t("usage.list.label")}
      className="grid grid-cols-1 gap-5 tablet:grid-cols-2 tablet:gap-3"
    >
      {records.map((record) => {
        const rows = [
          { key: "type", value: <UsageTypeBadge record={record} /> },
          {
            key: "date",
            value: formatDateTime(record.usedAt, record.usedAtText),
          },
          {
            key: "campaignName",
            value: (
              <div className="flex min-w-0 items-center gap-3">
                <CampaignThumbnail record={record} />
                <FullTextHint
                  text={record.campaignName}
                  lines={2}
                  className="min-w-0 flex-1"
                />
              </div>
            ),
          },
          { key: "usage", value: labels.usageDetail(record) },
          { key: "amount", value: <UsageAmount amount={record.amount} /> },
          { key: "remaining", value: formatWon(record.remainingAmount) },
        ] as const;

        return (
          <li key={record.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline-foreground"
                size="sm"
                onClick={() => onClickDetail(record)}
              >
                {t("usage.action.detail")}
              </Button>
            </div>
            <dl className="grid flex-1 grid-cols-[minmax(6.25rem,7rem)_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`usage.column.${key}`)}
                  </dt>
                  <dd className="flex min-h-12 min-w-0 items-center border-b px-4 py-2 text-sm leading-5 break-all text-foreground [div:last-child>&]:border-b-0">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
