import { EllipsisVertical } from "lucide-react";

import { ChargeStatusText } from "@/entities/bigbird-money";
import { EmptyTableFrame } from "@/shared/components/list-filter";
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
  /** 오른쪽 패널(충전·출금·거래 상세)이 열려 있으면 은행·계좌 번호·입금자 명 열을 숨김(시안 캡션 11224:105057). */
  isPanelOpen?: boolean;
}

// Figma 충전/출금 내역 표(11224:103702): 구분(배지)·일자·금액·은행·계좌 번호·입금자 명·입금 상태(글자)·거래명세서·상세 보기, 행 높이 48.
// 결제 수단은 거래 상세에만 있음.
// 지정한 폭은 자동 표 배치에서 최소 폭이 되어 시안 폭을 지킴(패널이 열려 좁아지면 일시는 말줄임).
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
        <TableHead className="w-18">{t("charge.column.type")}</TableHead>
        <TableHead className="w-45">{t("charge.column.date")}</TableHead>
        <TableHead className="w-36">{t("charge.column.amount")}</TableHead>
        {!isPanelOpen && (
          <>
            <TableHead className="w-34">{t("charge.column.bank")}</TableHead>
            <TableHead className="w-44">{t("charge.column.account")}</TableHead>
            <TableHead className="w-44">{t("charge.column.holder")}</TableHead>
          </>
        )}
        <TableHead className="w-28">{t("charge.column.status")}</TableHead>
        <TableHead className="w-28 text-center">
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
              <ChargeTypeBadge record={record} />
            </TableCell>
            <TableCell>
              {formatDateTime(record.requestedAt, record.requestedAtText)}
            </TableCell>
            <TableCell>
              <ChargeAmount record={record} />
            </TableCell>
            {!isPanelOpen && (
              <>
                <TableCell>{record.bankName}</TableCell>
                <TableCell>{record.accountNumber}</TableCell>
                <TableCell>{record.holderName}</TableCell>
              </>
            )}
            <TableCell>
              <ChargeStatusText
                serverValue={record.statusText}
                status={record.status}
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
        ))}
      </TableBody>
    </Table>
  );
}
