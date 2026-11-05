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
  /** 옆 패널이 열려 있으면 캠페인 명·잔액 열을 숨김(시안 `11224:103932`, 캡션의 "내역 미노출"과 달리 시안은 내역 열을 남김). */
  isPanelOpen?: boolean;
}

// Figma 사용 내역 표(11224:103786): 구분(배지)·일자·캠페인 명·내역·금액·잔액·상세 보기. 캠페인 코드 열은 없고 상세 보기에만 있음.
// 지정한 폭은 자동 표 배치에서 최소 폭이 되어 시안 폭을 지킴. 캠페인 명은 두 줄까지 보이고 말줄임(행 높이 56, 시안 `11224:103786`).
// 캠페인 명 옆에 40px 썸네일(`mainImageUrl`, 없으면 기본 이미지).
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
  const columnCount = isPanelOpen ? 5 : 7;

  return (
    <Table headerTone="gray" aria-label={t("usage.list.label")}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">{t("usage.column.type")}</TableHead>
          <TableHead className="w-45">{t("usage.column.date")}</TableHead>
          {!isPanelOpen && (
            <TableHead className="w-66.5">
              {t("usage.column.campaignName")}
            </TableHead>
          )}
          <TableHead className="w-50">{t("usage.column.usage")}</TableHead>
          <TableHead className="w-36">{t("usage.column.amount")}</TableHead>
          {!isPanelOpen && (
            <TableHead className="w-36">
              {t("usage.column.remaining")}
            </TableHead>
          )}
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
              colSpan={columnCount}
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
              <TableCell className="h-14">
                <UsageTypeBadge record={record} />
              </TableCell>
              <TableCell className="h-14">
                {formatDateTime(record.usedAt, record.usedAtText)}
              </TableCell>
              {!isPanelOpen && (
                <TableCell className="h-14 whitespace-normal">
                  <div className="flex items-center gap-3">
                    <CampaignThumbnail record={record} />
                    <FullTextHint
                      text={record.campaignName}
                      lines={2}
                      className="min-w-0 flex-1"
                    />
                  </div>
                </TableCell>
              )}
              <TableCell className="h-14 whitespace-normal">
                <FullTextHint text={labels.usageDetail(record)} lines={2} />
              </TableCell>
              <TableCell className="h-14">
                <UsageAmount amount={record.amount} />
              </TableCell>
              {!isPanelOpen && (
                <TableCell className="h-14">
                  {formatWon(record.remainingAmount)}
                </TableCell>
              )}
              <TableCell className="h-14 text-center">
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
