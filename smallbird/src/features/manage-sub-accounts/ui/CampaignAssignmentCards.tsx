import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";

import { getStatusBadgeVariant, useCodeLabel } from "../lib/use-code-label";

import type { CampaignAssignment } from "../model/types";

interface CampaignAssignmentCardsProps {
  campaigns: CampaignAssignment[];
  className?: string;
  onChangeAssignment: (campaignIdx: number, next: boolean) => void;
}

// Figma 캠페인 할당 카드(10724:186508 PC 패널·10724:187291 TAB·10724:188014 MO): 라벨 열(회색)·값 열 표에 "담당 여부" Switch까지 한 카드.
// 카드 간격 12, 행 높이 48(캠페인 명이 길면 줄바꿈으로 늘어남). 한 줄에 몇 장 놓을지는 호출하는 쪽이 `className`으로 정함(TAB은 2열).
export function CampaignAssignmentCards({
  campaigns,
  className,
  onChangeAssignment,
}: CampaignAssignmentCardsProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const label = useCodeLabel();

  return (
    <ul
      aria-label={t("access.campaign.title")}
      className={cn("grid grid-cols-1 gap-3", className)}
    >
      {campaigns.map((campaign) => {
        const rows = [
          {
            key: "name",
            label: t("access.campaign.column.name"),
            // 캠페인 명은 말줄임 없이 줄바꿈해 전부 보임(긴 이름도 잘리지 않음).
            value: (
              <span className="wrap-anywhere ko:break-keep">
                {campaign.name}
              </span>
            ),
          },
          {
            key: "productType",
            label: t("access.campaign.column.productType"),
            value: label.productType(campaign.productType),
          },
          {
            key: "detailType",
            label: t("access.campaign.column.detailType"),
            value: label.detailType(campaign.detailType),
          },
          {
            key: "status",
            label: t("access.campaign.column.status"),
            value: (
              <Badge variant={getStatusBadgeVariant(campaign.status)}>
                {label.status(campaign.status)}
              </Badge>
            ),
          },
          {
            key: "assigned",
            label: t("access.campaign.column.assigned"),
            value: (
              <Switch
                checked={campaign.isAssigned}
                aria-label={t("access.campaign.switchLabel", {
                  name: campaign.name,
                })}
                onCheckedChange={(next) =>
                  onChangeAssignment(campaign.campaignIdx, next)
                }
              />
            ),
          },
        ];

        return (
          <li key={campaign.campaignIdx}>
            <dl className="grid grid-cols-[7.75rem_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map((row) => (
                <div key={row.key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {row.label}
                  </dt>
                  <dd className="flex min-h-12 min-w-0 items-center border-b px-4 py-3 text-sm leading-5 text-foreground [div:last-child>&]:border-b-0">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
