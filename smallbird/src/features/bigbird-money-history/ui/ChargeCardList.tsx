import { ChargeStatusText } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useMoneyFormat } from "../lib/use-money-format";
import { ChargeAmount } from "./ChargeAmount";
import { ChargeTypeBadge } from "./ChargeTypeBadge";
import { ReceiptButton } from "./ReceiptButton";

import type { ChargeRecord } from "../model/charge-types";

interface ChargeCardListProps {
  records: ChargeRecord[];
  onClickDetail: (record: ChargeRecord) => void;
}

// Figma 건별 카드(TAB 2열 11224:104315, MO 1열 11224:105553): 위쪽 오른쪽 정렬 "거래명세서 ⬇"·"상세 보기" 버튼, 아래 라벨 열(회색)·값 열 7행 표.
// TAB은 카드 사이 12px로 2열이고 같은 줄 카드는 높이를 맞춤.
export function ChargeCardList({
  records,
  onClickDetail,
}: ChargeCardListProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime } = useMoneyFormat();

  return (
    <ul
      aria-label={t("charge.list.label")}
      className="grid grid-cols-1 gap-5 tablet:grid-cols-2 tablet:gap-3"
    >
      {records.map((record) => {
        const rows = [
          { key: "type", value: <ChargeTypeBadge record={record} /> },
          {
            key: "date",
            value: formatDateTime(record.requestedAt, record.requestedAtText),
          },
          { key: "amount", value: <ChargeAmount record={record} /> },
          { key: "bank", value: record.bankName },
          { key: "account", value: record.accountNumber },
          { key: "holder", value: record.holderName },
          {
            key: "status",
            value: (
              <ChargeStatusText
                serverValue={record.statusText}
                status={record.status}
              />
            ),
          },
        ] as const;

        return (
          <li key={record.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-2">
              <ReceiptButton record={record} variant="card" />
              <Button
                variant="outline-foreground"
                size="sm"
                onClick={() => onClickDetail(record)}
              >
                {t("charge.action.detail")}
              </Button>
            </div>
            <dl className="grid flex-1 grid-cols-[minmax(6.25rem,7rem)_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`charge.column.${key}`)}
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
