import { ChargeStatusText } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE, orEmptyValue } from "@/shared/lib";
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

export function ChargeCardList({
  records,
  onClickDetail,
}: ChargeCardListProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime } = useMoneyFormat();

  return (
    <ul
      aria-label={t("charge.list.label")}
      className="grid grid-cols-1 gap-3 tablet:grid-cols-2"
    >
      {records.map((record) => {
        const rows = [
          {
            key: "type",
            value:
              record.type || record.typeText ? (
                <ChargeTypeBadge record={record} />
              ) : (
                EMPTY_VALUE
              ),
          },
          {
            key: "date",
            value: orEmptyValue(
              formatDateTime(record.requestedAt, record.requestedAtText),
            ),
          },
          {
            key: "amount",
            value:
              record.amount === null ? (
                EMPTY_VALUE
              ) : (
                <ChargeAmount record={record} />
              ),
          },
          { key: "bank", value: orEmptyValue(record.bankName) },
          { key: "account", value: orEmptyValue(record.accountNumber) },
          { key: "holder", value: orEmptyValue(record.holderName) },
          {
            key: "status",
            value:
              record.status || record.statusText ? (
                <ChargeStatusText
                  serverValue={record.statusText}
                  status={record.status}
                />
              ) : (
                EMPTY_VALUE
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
