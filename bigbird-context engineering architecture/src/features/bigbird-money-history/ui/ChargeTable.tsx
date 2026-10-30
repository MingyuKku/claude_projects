import { EllipsisVertical } from "lucide-react";

import { ChargeStatusBadge } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { useMoneyFormat } from "../lib/use-money-format";
import { usePaymentMethodLabel } from "../lib/use-payment-method-label";
import { ReceiptButton } from "./ReceiptButton";

import type { ChargeRecord } from "../model/charge-types";
import type { ReactNode } from "react";

interface ChargeTableProps {
  records: ChargeRecord[];
  /** 거래 상세를 열어 둔 행. 그 행을 활성(accent) 처리함. */
  activeId: string | null;
  onClickDetail: (record: ChargeRecord) => void;
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
}

const COLUMN_COUNT = 6;

// Figma 충전 상세 내역 표(10061:201721): 충전 일자·충전 요청 금액·결제 수단·입금 상태(배지)·거래명세서·상세 보기, 행 높이 48.
// 지정한 폭은 자동 표 배치에서 최소 폭이 되어 시안 폭을 지킴(패널이 열려 좁아지면 열이 줄고 일시는 말줄임).
export function ChargeTable({
  records,
  activeId,
  onClickDetail,
  emptyContent,
}: ChargeTableProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const paymentMethodLabel = usePaymentMethodLabel();

  return (
    <Table headerTone="gray" size="xs" aria-label={t("charge.list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("charge.column.requestedAt")}</TableHead>
          <TableHead>{t("charge.column.amount")}</TableHead>
          <TableHead>{t("charge.column.method")}</TableHead>
          <TableHead>{t("charge.column.status")}</TableHead>
          <TableHead className="w-24 text-center">
            {t("charge.column.receipt")}
          </TableHead>
          <TableHead className="w-24 text-center">
            {t("charge.column.detail")}
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
            <TableRow
              key={record.id}
              data-state={record.id === activeId ? "selected" : undefined}
            >
              <TableCell className="whitespace-normal">
                {formatDateTime(record.requestedAt, record.requestedAtText)}
              </TableCell>
              <TableCell>{formatWon(record.amount)}</TableCell>
              <TableCell>{paymentMethodLabel(record.payMethod)}</TableCell>
              <TableCell>
                <ChargeStatusBadge
                  serverValue={record.statusText}
                  status={record.status}
                  size="sm"
                />
              </TableCell>
              <TableCell className="text-center">
                <ReceiptButton record={record} variant="table" />
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="outline-foreground"
                  size="icon-sm"
                  className="min-w-0"
                  aria-label={t("charge.action.detail")}
                  onClick={() => onClickDetail(record)}
                >
                  <EllipsisVertical />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
