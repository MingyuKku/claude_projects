import {
  CampaignDemoTag,
  CampaignStageBadge,
  CampaignTypeText,
} from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";
import { Separator } from "@/shared/ui/separator";

import { getRowActions } from "../lib/campaign-actions";
import { formatCampaignPeriod } from "../lib/format-period";
import { IconAction, ShortcutButton } from "./CampaignRowActions";
import { CampaignThumbnail } from "./CampaignThumbnail";

import type { ShortcutKind } from "../lib/campaign-actions";
import type { CampaignSummary } from "@/entities/campaign";
import type { ReactNode } from "react";

interface CampaignCardListProps {
  records: CampaignSummary[];
  isSubAccount: boolean;
  onClickShortcut: (campaign: CampaignSummary, kind: ShortcutKind) => void;
  onClickDetail: (campaign: CampaignSummary) => void;
  onDeleted: () => void;
}

interface CardRowProps {
  label: string;
  children: ReactNode;
}

function CardRow({ label, children }: CardRowProps) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <dt className="shrink-0 ds-text-sm-5-semibold text-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 items-center justify-end gap-2 text-right ds-text-sm-5-normal text-foreground">
        {children}
      </dd>
    </div>
  );
}

// Figma 캠페인 카드(TAB 2열·MO 1열): 썸네일·이름·부제 → 바로 가기(넓게) + 아이콘 → 구분선 → 진행 단계·캠페인 유형(데모는 DEMO 태그)·캠페인 기간.
export function CampaignCardList({
  records,
  isSubAccount,
  onClickShortcut,
  onClickDetail,
  onDeleted,
}: CampaignCardListProps) {
  const { t } = useTranslation("pages/campaign-status");

  return (
    <ul
      aria-label={t("list.label")}
      className="grid grid-cols-1 gap-4 tablet:grid-cols-2"
    >
      {records.map((campaign) => {
        const { shortcut, iconAction } = getRowActions(campaign, {
          isSubAccount,
        });

        return (
          <li
            key={campaign.id}
            className="flex flex-col rounded-lg border bg-card"
          >
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <CampaignThumbnail imageUrl={campaign.thumbnailUrl} />
                <div className="flex min-w-0 flex-1 flex-col gap-1 ds-text-base-none-medium">
                  <p className="line-clamp-2 text-foreground">
                    {campaign.name}
                  </p>
                  {campaign.description && (
                    <p className="line-clamp-2 ds-text-base-none-normal text-muted-foreground">
                      {campaign.description}
                    </p>
                  )}
                </div>
              </div>
              {(shortcut || iconAction) && (
                <div className="flex items-center gap-2">
                  {shortcut && (
                    <ShortcutButton
                      kind={shortcut}
                      className="min-w-0 flex-1"
                      onClick={() => onClickShortcut(campaign, shortcut)}
                    />
                  )}
                  {iconAction && (
                    <IconAction
                      kind={iconAction}
                      campaign={campaign}
                      onClickDetail={() => onClickDetail(campaign)}
                      onDeleted={onDeleted}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="px-4">
              <Separator />
            </div>
            <dl className="flex flex-col px-4 pt-2.5 pb-4">
              <CardRow label={t("column.stage")}>
                <CampaignStageBadge
                  stage={campaign.stage}
                  rawStatus={campaign.rawStatus}
                />
              </CardRow>
              <CardRow label={t("column.type")}>
                <CampaignTypeText campaign={campaign} />
                {campaign.isDemo && <CampaignDemoTag />}
              </CardRow>
              <CardRow label={t("column.period")}>
                {formatCampaignPeriod(campaign)}
              </CardRow>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
