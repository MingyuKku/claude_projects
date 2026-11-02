import { FullTextHint } from "@/shared/components/full-text-hint";
import { useTranslation } from "@/shared/i18n";

import { useMoneyFormat } from "../lib/use-money-format";
import { UsageAmount } from "./UsageAmount";

import type { UsageRecord } from "../model/usage-types";

interface UsageCardListProps {
  records: UsageRecord[];
}

// Figma MO 카드(7053:272961): 상세 보기 버튼 없이 모든 정보를 인라인으로. 라벨 열(회색)·값 열의 7행 표.
// 값이 없는 항목도 행을 숨기지 않고 "-"로 둠(스펙 §3).
export function UsageCardList({ records }: UsageCardListProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();

  return (
    <ul aria-label={t("usage.list.label")} className="flex flex-col gap-5">
      {records.map((record) => {
        const rows = [
          {
            key: "usedAt",
            value: formatDateTime(record.usedAt, record.usedAtText),
          },
          {
            key: "campaignName",
            value: <FullTextHint text={record.campaignName} lines={2} />,
          },
          { key: "campaignType", value: record.campaignType },
          { key: "campaignCode", value: record.campaignCode },
          { key: "usage", value: record.usageLabel },
          {
            key: "amount",
            value: (
              <UsageAmount amount={record.amount} className="font-semibold" />
            ),
          },
          {
            key: "remaining",
            value: (
              <span className="font-semibold">
                {formatWon(record.remainingAmount)}
              </span>
            ),
          },
        ] as const;

        return (
          <li key={record.id}>
            <dl className="grid grid-cols-[minmax(6.25rem,max-content)_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`usage.card.${key}`)}
                  </dt>
                  <dd className="flex min-h-12 min-w-0 items-center border-b px-4 py-2 text-sm leading-5 text-foreground [div:last-child>&]:border-b-0">
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
