import { EllipsisVertical } from "lucide-react";

import { FullTextHint } from "@/shared/components/full-text-hint";
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
import { UsageAmount } from "./UsageAmount";

import type { UsageRecord } from "../model/usage-types";
import type { ReactNode } from "react";

interface UsageTableProps {
  records: UsageRecord[];
  /** 상세 보기를 열어 둔 행. 그 행을 활성(accent) 처리함. */
  activeId: string | null;
  onClickDetail: (record: UsageRecord) => void;
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
}

const COLUMN_COUNT = 6;

// 열 순서와 폭은 사용 내역 표 변경 안(스펙 §2): 캠페인 명 266·사용 일자 180·사용 내역 266·사용 금액 180·캠페인 코드 180·상세 보기 96.
// 지정한 폭은 자동 표 배치에서 최소 폭이 되어 시안 폭을 지킴. 캠페인 명은 두 줄까지 보이고 말줄임(행 높이 64).
export function UsageTable({
  records,
  activeId,
  onClickDetail,
  emptyContent,
}: UsageTableProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime } = useMoneyFormat();

  return (
    <Table headerTone="gray" aria-label={t("usage.list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-66.5">
            {t("usage.column.campaignName")}
          </TableHead>
          <TableHead className="w-45">{t("usage.column.usedAt")}</TableHead>
          <TableHead className="w-66.5">{t("usage.column.usage")}</TableHead>
          <TableHead className="w-45">{t("usage.column.amount")}</TableHead>
          <TableHead className="w-45">
            {t("usage.column.campaignCode")}
          </TableHead>
          <TableHead className="w-24 text-center">
            {t("usage.column.detail")}
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
              <TableCell className="h-16 whitespace-normal">
                <FullTextHint text={record.campaignName} lines={2} />
              </TableCell>
              <TableCell className="h-16">
                {formatDateTime(record.usedAt, record.usedAtText)}
              </TableCell>
              <TableCell className="h-16 whitespace-normal">
                <FullTextHint text={record.usageLabel} lines={2} />
              </TableCell>
              <TableCell className="h-16 font-semibold">
                <UsageAmount amount={record.amount} />
              </TableCell>
              <TableCell className="h-16">{record.campaignCode}</TableCell>
              <TableCell className="h-16 text-center">
                <Button
                  variant="outline-foreground"
                  size="icon-sm"
                  className="min-w-0"
                  aria-label={t("usage.action.detail")}
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
