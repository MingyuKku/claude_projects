import {
  PaymentStatusBadge,
  usePaymentMethodLabel,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";
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

// Figma 구독 결제 내역 표(8010:404671): 결제 일자 183·결제 내역 240·결제 금액 183·결제 수단 183·결제 상태 183·거래명세서 96, 행 높이 48.
// 지정한 폭은 자동 표 배치에서 최소 폭이 되어 시안 폭을 지킴.
export function PaymentTable({ records, emptyContent }: PaymentTableProps) {
  const { t } = useTranslation("features/payment-history");
  const { formatDateTime, formatWon } = usePaymentFormat();
  const paymentMethodLabel = usePaymentMethodLabel();

  return (
    <Table headerTone="gray" size="xs" aria-label={t("list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-45.75">{t("column.paidAt")}</TableHead>
          <TableHead className="w-60">{t("column.name")}</TableHead>
          <TableHead className="w-45.75">{t("column.amount")}</TableHead>
          <TableHead className="w-45.75">{t("column.method")}</TableHead>
          <TableHead className="w-45.75">{t("column.status")}</TableHead>
          <TableHead className="w-24 text-center">
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
                {formatDateTime(record.paidAt)}
              </TableCell>
              <TableCell className="whitespace-normal">{record.name}</TableCell>
              <TableCell>{formatWon(record.amount)}</TableCell>
              <TableCell className="whitespace-normal">
                {paymentMethodLabel(record.method, record.cardKind)}
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
