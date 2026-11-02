import { ChargeStatusBadge } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useMoneyFormat } from "../lib/use-money-format";
import { usePaymentMethodLabel } from "../lib/use-payment-method-label";
import { ReceiptButton } from "./ReceiptButton";

import type { ChargeRecord } from "../model/charge-types";

interface ChargeCardListProps {
  records: ChargeRecord[];
  onClickDetail: (record: ChargeRecord) => void;
}

// Figma MO 카드(10061:205830): 위쪽에 "상세 보기"·"거래명세서 ⬇" 버튼(오른쪽 정렬, 사용자 확인), 아래에 라벨 열(회색)·값 열 4행 표.
export function ChargeCardList({
  records,
  onClickDetail,
}: ChargeCardListProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const paymentMethodLabel = usePaymentMethodLabel();

  return (
    <ul aria-label={t("charge.list.label")} className="flex flex-col gap-5">
      {records.map((record) => {
        const rows = [
          {
            key: "requestedAt",
            value: formatDateTime(record.requestedAt, record.requestedAtText),
          },
          { key: "amount", value: formatWon(record.amount) },
          { key: "method", value: paymentMethodLabel(record.payMethod) },
          {
            key: "status",
            value: (
              <ChargeStatusBadge
                serverValue={record.statusText}
                status={record.status}
                size="sm"
              />
            ),
          },
        ] as const;

        return (
          <li key={record.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline-foreground"
                size="sm"
                onClick={() => onClickDetail(record)}
              >
                {t("charge.action.detail")}
              </Button>
              <ReceiptButton record={record} variant="card" />
            </div>
            <dl className="grid grid-cols-[minmax(6.25rem,max-content)_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`charge.card.${key}`)}
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
