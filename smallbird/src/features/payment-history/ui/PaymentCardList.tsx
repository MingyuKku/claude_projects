import {
  PaymentStatusBadge,
  usePaymentMethodLabel,
  useSubscriptionProductName,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";
import { orEmptyValue } from "@/shared/lib";

import { usePaymentFormat } from "../lib/use-payment-format";
import { ReceiptButton } from "./ReceiptButton";

import type { PaymentRecord } from "@/entities/subscription";

interface PaymentCardListProps {
  records: PaymentRecord[];
}

// 같은 줄 카드는 grid 기본 stretch로 높이를 맞춤.
export function PaymentCardList({ records }: PaymentCardListProps) {
  const { t } = useTranslation("features/payment-history");
  const { formatDateTime, formatWon } = usePaymentFormat();
  const paymentMethodLabel = usePaymentMethodLabel();
  const productName = useSubscriptionProductName();

  return (
    <ul
      aria-label={t("list.label")}
      className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-3"
    >
      {records.map((record) => {
        const rows = [
          { key: "paidAt", value: orEmptyValue(formatDateTime(record.paidAt)) },
          {
            key: "name",
            value: orEmptyValue(
              productName(
                record.productType,
                record.billingPeriod,
                record.name,
              ),
            ),
          },
          { key: "amount", value: formatWon(record.amount) },
          {
            key: "method",
            value: orEmptyValue(
              paymentMethodLabel(record.method, record.cardKind),
            ),
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
