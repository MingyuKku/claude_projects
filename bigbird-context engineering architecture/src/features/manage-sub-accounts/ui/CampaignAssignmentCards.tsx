import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";

import { getStatusBadgeVariant, useCodeLabel } from "../lib/use-code-label";
import { FullTextHint } from "./FullTextHint";

import type { CampaignAssignment } from "../model/types";

interface CampaignAssignmentCardsProps {
  campaigns: CampaignAssignment[];
  onChangeAssignment: (campaignIdx: number, next: boolean) => void;
}

// Figma MO 캠페인 카드(10061:206699): 위 오른쪽에 "담당 여부" 라벨 + Switch(md), 아래에 라벨 열(회색)·값 열 표. 카드 간격 12.
export function CampaignAssignmentCards({
  campaigns,
  onChangeAssignment,
}: CampaignAssignmentCardsProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const label = useCodeLabel();

  return (
    <ul aria-label={t("access.campaign.title")} className="flex flex-col gap-3">
      {campaigns.map((campaign) => {
        const assignedLabel = t("access.campaign.column.assigned");
        const rows = [
          {
            key: "name",
            label: t("access.campaign.column.name"),
            value: <FullTextHint text={campaign.name} />,
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
            label: t("access.campaign.column.statusShort"),
            value: (
              <Badge variant={getStatusBadgeVariant(campaign.status)}>
                {label.status(campaign.status)}
              </Badge>
            ),
          },
        ];

        return (
          <li key={campaign.campaignIdx} className="flex flex-col gap-3">
            <label className="flex items-center justify-end gap-2 text-sm leading-none font-medium text-foreground">
              {assignedLabel}
              <Switch
                checked={campaign.isAssigned}
                aria-label={t("access.campaign.switchLabel", {
                  name: campaign.name,
                })}
                onCheckedChange={(next) =>
                  onChangeAssignment(campaign.campaignIdx, next)
                }
              />
            </label>
            <dl className="grid grid-cols-[5.25rem_minmax(0,1fr)] overflow-hidden rounded-lg border">
              {rows.map((row) => (
                <div key={row.key} className="contents">
                  <dt className="flex min-h-14 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {row.label}
                  </dt>
                  <dd className="flex min-h-14 min-w-0 items-center border-b px-4 text-sm leading-5 text-foreground [div:last-child>&]:border-b-0">
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
