import { EllipsisVertical } from "lucide-react";

import { FullTextHint } from "@/shared/components/full-text-hint";
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
import { useUsageLabels } from "../lib/use-usage-labels";
import { CampaignThumbnail } from "./CampaignThumbnail";
import { UsageAmount } from "./UsageAmount";
import { UsageTypeBadge } from "./UsageTypeBadge";

import type { UsageRecord } from "../model/usage-types";
import type { ReactNode } from "react";

interface UsageTableProps {
  records: UsageRecord[];
  /** 상세 보기를 열어 둔 행. 그 행을 활성(accent) 처리함. */
  activeId: string | null;
  onClickDetail: (record: UsageRecord) => void;
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
  /** 옆 패널이 열려 있으면 캠페인 명·잔액 열을 숨김(시안 캡션의 "내역 미노출"과 달리 시안 화면대로 내역 열은 남김). */
  isPanelOpen?: boolean;
}

// 시안의 고정 열만 폭을 주고 가변 열(캠페인 명)이 남는 폭을 가짐.
export function UsageTable({
  records,
  activeId,
  onClickDetail,
  emptyContent,
  isPanelOpen = false,
}: UsageTableProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const labels = useUsageLabels();

  const header = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-16.25">{t("usage.column.type")}</TableHead>
        <TableHead className="w-45">{t("usage.column.date")}</TableHead>
        {!isPanelOpen && (
          <TableHead>{t("usage.column.campaignName")}</TableHead>
        )}
        <TableHead className="w-50">{t("usage.column.usage")}</TableHead>
        <TableHead className="w-34.25">{t("usage.column.amount")}</TableHead>
        {!isPanelOpen && (
          <TableHead className="w-34.25">
            {t("usage.column.remaining")}
          </TableHead>
        )}
        <TableHead className="w-24 text-center">
          {t("usage.column.detail")}
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
            aria-label={t("usage.list.label")}
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
    <Table headerTone="gray" aria-label={t("usage.list.label")}>
      {header}
      <TableBody>
        {records.map((record) => (
          <TableRow
            key={record.id}
            data-state={record.id === activeId ? "selected" : undefined}
          >
            <TableCell className="h-14">
              {record.type || record.typeText ? (
                <UsageTypeBadge record={record} />
              ) : (
                EMPTY_VALUE
              )}
            </TableCell>
            <TableCell className="h-14">
              {orEmptyValue(formatDateTime(record.usedAt, record.usedAtText))}
            </TableCell>
            {!isPanelOpen && (
              <TableCell className="h-14 whitespace-normal">
                <div className="flex items-center gap-3">
                  <CampaignThumbnail record={record} />
                  <FullTextHint
                    text={orEmptyValue(record.campaignName)}
                    lines={2}
                    className="min-w-0 flex-1"
                  />
                </div>
              </TableCell>
            )}
            <TableCell className="h-14 whitespace-normal">
              <FullTextHint
                text={orEmptyValue(labels.usageDetail(record))}
                lines={2}
              />
            </TableCell>
            <TableCell className="h-14">
              {record.amount === null ? (
                EMPTY_VALUE
              ) : (
                <UsageAmount amount={record.amount} />
              )}
            </TableCell>
            {!isPanelOpen && (
              <TableCell className="h-14">
                {orEmptyValue(formatWon(record.remainingAmount))}
              </TableCell>
            )}
            <TableCell className="h-14 text-center">
              <Button
                variant="outline-foreground"
                size="icon"
                // 시안이 충전/출금 표(sm)와 달리 md 크기를 씀.
                className="min-w-0 rounded-md"
                aria-label={t("usage.action.detail")}
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
