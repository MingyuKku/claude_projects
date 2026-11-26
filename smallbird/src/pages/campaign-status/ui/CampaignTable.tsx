import {
  CampaignDemoTag,
  CampaignStageBadge,
  CampaignTypeText,
} from "@/entities/campaign";
import { FullTextHint } from "@/shared/components/full-text-hint";
import { EmptyTableFrame } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { getRowActions } from "../lib/campaign-actions";
import { formatCampaignPeriod } from "../lib/format-period";
import { IconAction, ShortcutButton } from "./CampaignRowActions";
import { CampaignThumbnail } from "./CampaignThumbnail";

import type { ShortcutKind } from "../lib/campaign-actions";
import type { CampaignSummary } from "@/entities/campaign";
import type { ReactNode } from "react";

interface CampaignTableProps {
  records: CampaignSummary[];
  isSubAccount: boolean;
  onClickShortcut: (campaign: CampaignSummary, kind: ShortcutKind) => void;
  onClickDetail: (campaign: CampaignSummary) => void;
  onDeleted: () => void;
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
}

// Figma 캠페인 현황 표(PC): 진행 단계·캠페인 명(썸네일·부제)·캠페인 유형·캠페인 기간·바로 가기·아이콘. 행 높이 76.
// 데모 캠페인은 캠페인 명 칸 오른쪽 끝에 DEMO 태그(3.0.3).
export function CampaignTable({
  records,
  isSubAccount,
  onClickShortcut,
  onClickDetail,
  onDeleted,
  emptyContent,
}: CampaignTableProps) {
  const { t } = useTranslation("pages/campaign-status");

  const header = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-25.5 text-center">
          {t("column.stage")}
        </TableHead>
        <TableHead>{t("column.name")}</TableHead>
        <TableHead className="w-40">{t("column.type")}</TableHead>
        <TableHead className="w-65">{t("column.period")}</TableHead>
        <TableHead className="w-35">{t("column.shortcut")}</TableHead>
        <TableHead className="w-22.5">
          <span className="sr-only">{t("column.action")}</span>
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
            size="md"
            aria-label={t("list.label")}
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
    <Table headerTone="gray" size="md" aria-label={t("list.label")}>
      {header}
      <TableBody>
        {records.map((campaign) => {
          const { shortcut, iconAction } = getRowActions(campaign, {
            isSubAccount,
          });

          return (
            <TableRow key={campaign.id}>
              <TableCell className="text-center">
                <CampaignStageBadge
                  stage={campaign.stage}
                  rawStatus={campaign.rawStatus}
                />
              </TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-3">
                  <CampaignThumbnail imageUrl={campaign.thumbnailUrl} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <FullTextHint
                      text={campaign.name}
                      className="ds-text-sm-5-medium"
                    />
                    {campaign.productName && (
                      <FullTextHint
                        text={campaign.productName}
                        className="ds-text-sm-5-normal text-muted-foreground"
                      />
                    )}
                  </div>
                  {campaign.isDemo && <CampaignDemoTag />}
                </div>
              </TableCell>
              <TableCell>
                <CampaignTypeText campaign={campaign} />
              </TableCell>
              <TableCell>{formatCampaignPeriod(campaign)}</TableCell>
              <TableCell>
                {shortcut && (
                  <ShortcutButton
                    kind={shortcut}
                    onClick={() => onClickShortcut(campaign, shortcut)}
                  />
                )}
              </TableCell>
              <TableCell>
                {iconAction && (
                  <IconAction
                    kind={iconAction}
                    campaign={campaign}
                    onClickDetail={() => onClickDetail(campaign)}
                    onDeleted={onDeleted}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
