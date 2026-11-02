import {
  PaymentStatusBadge,
  usePaymentMethodLabel,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

import { usePaymentFormat } from "../lib/use-payment-format";
import { ReceiptButton } from "./ReceiptButton";

import type { PaymentRecord } from "@/entities/subscription";

interface PaymentCardListProps {
  records: PaymentRecord[];
}

// Figma 건별 카드(TAB 2열 7064:187268, MO 1열 7064:190017): 위쪽 오른쪽 정렬 "거래명세서 ⬇", 아래 라벨 열(회색)·값 열 5행 표.
// TAB 카드는 카드 사이 12px로 2열이고, 홀수면 마지막 카드는 왼쪽에 놓이며 같은 줄 카드는 높이를 맞춤(grid 기본 stretch).
export function PaymentCardList({ records }: PaymentCardListProps) {
  const { t } = useTranslation("features/payment-history");
  const { formatDateTime, formatWon } = usePaymentFormat();
  const paymentMethodLabel = usePaymentMethodLabel();

  return (
    <ul
      aria-label={t("list.label")}
      className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-3"
    >
      {records.map((record) => {
        const rows = [
          { key: "paidAt", value: formatDateTime(record.paidAt) },
          { key: "name", value: record.name },
          { key: "amount", value: formatWon(record.amount) },
          {
            key: "method",
            value: paymentMethodLabel(record.method, record.cardKind),
          },
          {
            key: "status",
            value: <PaymentStatusBadge serverValue={record.status} size="sm" />,
          },
        ] as const;

        return (
          <li key={record.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-2">
              <ReceiptButton record={record} variant="card" />
            </div>
            <dl className="grid flex-1 grid-cols-[minmax(6.25rem,7rem)_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`column.${key}`)}
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
