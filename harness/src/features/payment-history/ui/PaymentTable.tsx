import {
  PaymentStatusBadge,
  usePaymentMethodLabel,
  useSubscriptionProductName,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";
import { orEmptyValue } from "@/shared/lib";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { usePaymentFormat } from "../lib/use-payment-format";
import { ReceiptButton } from "./ReceiptButton";

import type { PaymentRecord } from "@/entities/subscription";
import type { ReactNode } from "react";

interface PaymentTableProps {
  records: PaymentRecord[];
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
}

const COLUMN_COUNT = 6;

// 고정 열만 폭을 주고 가변 열은 비워 남는 폭을 나눠 가지게 함. 자동 표 배치라 내용이 더 넓으면 열이 늘어남.
export function PaymentTable({ records, emptyContent }: PaymentTableProps) {
  const { t } = useTranslation("features/payment-history");
  const { formatDateTime, formatWon } = usePaymentFormat();
  const paymentMethodLabel = usePaymentMethodLabel();
  const productName = useSubscriptionProductName();

  return (
    <Table headerTone="gray" size="xs" aria-label={t("list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("column.paidAt")}</TableHead>
          <TableHead>{t("column.name")}</TableHead>
          <TableHead>{t("column.amount")}</TableHead>
          <TableHead>{t("column.method")}</TableHead>
          <TableHead className="w-35">{t("column.status")}</TableHead>
          <TableHead className="w-35 text-center">
            {t("column.receipt")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {emptyContent ? (
          // 빈 상태 안내 행은 누를 대상이 아니라 호버 색을 없앰.
          <TableRow className="[--table-row-hover:transparent]">
            <TableCell
              colSpan={COLUMN_COUNT}
              className="h-auto p-0 whitespace-normal"
            >
              {emptyContent}
            </TableCell>
          </TableRow>
        ) : (
          records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="whitespace-normal">
                {orEmptyValue(formatDateTime(record.paidAt))}
              </TableCell>
              <TableCell className="whitespace-normal">
                {orEmptyValue(
                  productName(
                    record.productType,
                    record.billingPeriod,
                    record.name,
                  ),
                )}
              </TableCell>
              <TableCell>{formatWon(record.amount)}</TableCell>
              <TableCell className="whitespace-normal">
                {orEmptyValue(
                  paymentMethodLabel(record.method, record.cardKind),
                )}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge serverValue={record.status} size="sm" />
              </TableCell>
              <TableCell className="text-center">
                <ReceiptButton record={record} variant="table" />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
