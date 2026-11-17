import { InfiniteScrollSentinel } from "@/shared/components/infinite-list";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";

import { CAMPAIGN_TYPE_LABEL_KEYS } from "../../model/campaign-type-labels";
import { PLATFORM_ICON_NAMES, PLATFORM_LABEL_KEYS } from "../../model/platform";

import type { CopySourceCampaign } from "@/entities/campaign";
import type { ReactNode } from "react";

interface CopySourceListProps {
  records: readonly CopySourceCampaign[];
  selectedIdx: number | null;
  /** PC(드로어 798)는 표, TAB·MO(서브 화면)는 카드. */
  variant: "table" | "cards";
  hasMore: boolean;
  onSelect: (campaignIdx: number) => void;
  onReachEnd: () => void;
}

// 이전 캠페인 목록(시안 PC 13320:115656 표, MO 125805 카드). 1개만 고르고 다른 행을 고르면 앞 선택이 풀림.
// 헤더 전체 선택 체크박스는 없음(3.0.3). 끝에 닿으면 다음 쪽을 이어 읽음.
export function CopySourceList({
  records,
  selectedIdx,
  variant,
  hasMore,
  onSelect,
  onReachEnd,
}: CopySourceListProps) {
  const { t } = useTranslation("features/register-campaign");

  function renderType(record: CopySourceCampaign) {
    if (record.campaignType) {
      return t(CAMPAIGN_TYPE_LABEL_KEYS[record.campaignType]);
    }
    return record.rawCampaignType ?? "-";
  }

  function renderPlatform(record: CopySourceCampaign, isIconOnly = false) {
    if (!record.platform) return "-";
    return (
      <span className="flex items-center gap-2">
        <PlatformIcon platform={PLATFORM_ICON_NAMES[record.platform]} />
        <span className={cn(isIconOnly && "sr-only")}>
          {t(PLATFORM_LABEL_KEYS[record.platform])}
        </span>
      </span>
    );
  }

  function renderDate(record: CopySourceCampaign) {
    const date = fromIsoDate(record.createdDate);
    return date ? formatNumericDate(date) : "-";
  }

  const sentinel = hasMore && (
    <InfiniteScrollSentinel key={records.length} onReach={onReachEnd} />
  );

  if (variant === "table") {
    return (
      <div className="overflow-hidden rounded-md border">
        <table className="w-full table-fixed text-left ds-text-sm-5-normal">
          <thead className="bg-muted/50 ds-text-sm-6-medium text-muted-foreground">
            <tr className="h-12 border-b">
              <th className="w-16">
                <span className="sr-only">
                  {t("loadPrevious.column.select")}
                </span>
              </th>
              <th className="w-42.5 font-medium">
                {t("loadPrevious.column.name")}
              </th>
              <th className="w-39.5 font-medium">
                {t("loadPrevious.column.brand")}
              </th>
              <th className="w-30.25 font-medium">
                {t("loadPrevious.column.type")}
              </th>
              <th className="w-37.25 font-medium">
                {t("loadPrevious.column.platform")}
              </th>
              <th className="font-medium">
                {t("loadPrevious.column.createdDate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isSelected = record.campaignIdx === selectedIdx;
              return (
                <tr
                  key={record.campaignIdx}
                  className={cn(
                    "h-12 cursor-pointer border-b last:border-b-0 hover:bg-muted/40",
                    isSelected && "bg-muted",
                  )}
                  onClick={() => onSelect(record.campaignIdx)}
                >
                  <td className="pl-4">
                    <Checkbox
                      checked={isSelected}
                      aria-label={record.name}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => onSelect(record.campaignIdx)}
                    />
                  </td>
                  <td className="truncate pr-4">{record.name}</td>
                  <td className="truncate pr-4">{record.brandName ?? "-"}</td>
                  <td className="truncate pr-4">{renderType(record)}</td>
                  <td className="pr-4">{renderPlatform(record)}</td>
                  <td>{renderDate(record)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sentinel}
      </div>
    );
  }

  // 표식은 목록 항목이 아니라 `<ul>` 밖에 둠(`<ul>`의 직계 자식은 `<li>`만).
  return (
    <>
      <ul className="flex flex-col gap-3">
        {records.map((record) => {
          const isSelected = record.campaignIdx === selectedIdx;
          return (
            <li key={record.campaignIdx} className="rounded-lg border">
              <label className="flex h-14 cursor-pointer items-center gap-4 px-4 py-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(record.campaignIdx)}
                />
                <span className="min-w-0 flex-1 truncate ds-text-base-none-semibold">
                  {record.name}
                </span>
              </label>
              <hr className="mx-4 border-border" />
              <dl className="flex flex-col pt-2.5 pb-4 ds-text-sm-5-normal">
                <CardRow label={t("loadPrevious.column.brand")}>
                  {record.brandName ?? "-"}
                </CardRow>
                <CardRow label={t("loadPrevious.column.type")}>
                  {renderType(record)}
                </CardRow>
                <CardRow label={t("loadPrevious.column.platform")}>
                  {renderPlatform(record, true)}
                </CardRow>
                <CardRow label={t("loadPrevious.column.createdDate")}>
                  {renderDate(record)}
                </CardRow>
              </dl>
            </li>
          );
        })}
      </ul>
      {sentinel}
    </>
  );
}

interface CardRowProps {
  label: string;
  children: ReactNode;
}

function CardRow({ label, children }: CardRowProps) {
  return (
    <div className="flex h-12 items-center justify-between gap-4 px-4">
      <dt className="ds-text-sm-5-semibold">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}
