import { EllipsisVertical } from "lucide-react";

import { ChargeStatusText } from "@/entities/bigbird-money";
import { EmptyTableFrame } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE, orEmptyValue } from "@/shared/lib";
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
import { ChargeAmount } from "./ChargeAmount";
import { ChargeTypeBadge } from "./ChargeTypeBadge";
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
  /** 오른쪽 패널(충전·출금·거래 상세)이 열려 있으면 은행·계좌 번호·입금자 명 열을 숨김. */
  isPanelOpen?: boolean;
}

// 시안의 고정 열만 폭을 주고 가변 열(일자·금액·입금자 명)은 비워 남는 폭을 나눠 가지게 함.
// 자동 표 배치라 내용이 더 넓으면 열이 늘어남.
export function ChargeTable({
  records,
  activeId,
  onClickDetail,
  emptyContent,
  isPanelOpen = false,
}: ChargeTableProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime } = useMoneyFormat();

  const header = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-16.25">{t("charge.column.type")}</TableHead>
        <TableHead>{t("charge.column.date")}</TableHead>
        <TableHead>{t("charge.column.amount")}</TableHead>
        {!isPanelOpen && (
          <>
            <TableHead className="w-29.25">{t("charge.column.bank")}</TableHead>
            <TableHead className="w-42.75">
              {t("charge.column.account")}
            </TableHead>
            <TableHead>{t("charge.column.holder")}</TableHead>
          </>
        )}
        <TableHead className="w-24.25">{t("charge.column.status")}</TableHead>
        <TableHead className="w-24 text-center">
          {t("charge.column.receipt")}
        </TableHead>
        <TableHead className="w-24 text-center">
          {t("charge.column.detail")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  if (emptyContent) {
    return (
      <EmptyTableFrame
        table={
          <Table
            headerTone="gray"
            size="xs"
            aria-label={t("charge.list.label")}
            containerClassName="rounded-none border-0"
          >
            {header}
          </Table>
        }
      >
        {emptyContent}
      </EmptyTableFrame>
    );
  }

  return (
    <Table headerTone="gray" size="xs" aria-label={t("charge.list.label")}>
      {header}
      <TableBody>
        {records.map((record) => (
          <TableRow
            key={record.id}
            data-state={record.id === activeId ? "selected" : undefined}
          >
            <TableCell>
              {record.type || record.typeText ? (
                <ChargeTypeBadge record={record} />
              ) : (
                EMPTY_VALUE
              )}
            </TableCell>
            <TableCell>
              {orEmptyValue(
                formatDateTime(record.requestedAt, record.requestedAtText),
              )}
            </TableCell>
            <TableCell>
              {record.amount === null ? (
                EMPTY_VALUE
              ) : (
                <ChargeAmount record={record} />
              )}
            </TableCell>
            {!isPanelOpen && (
              <>
                <TableCell>{orEmptyValue(record.bankName)}</TableCell>
                <TableCell>{orEmptyValue(record.accountNumber)}</TableCell>
                <TableCell>{orEmptyValue(record.holderName)}</TableCell>
              </>
            )}
            <TableCell>
              {record.status || record.statusText ? (
                <ChargeStatusText
                  serverValue={record.statusText}
                  status={record.status}
                />
              ) : (
                EMPTY_VALUE
              )}
            </TableCell>
            <TableCell className="text-center">
              <ReceiptButton record={record} variant="table" />
            </TableCell>
            <TableCell className="text-center">
              <Button
                variant="outline-foreground"
                size="icon-sm"
                className="size-9 min-w-0"
                aria-label={t("charge.action.detail")}
                onClick={() => onClickDetail(record)}
              >
                <EllipsisVertical />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
