import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { getStatusBadgeVariant, useCodeLabel } from "../lib/use-code-label";
import { FullTextHint } from "./FullTextHint";

import type { CampaignAssignment } from "../model/types";

interface CampaignAssignmentTableProps {
  campaigns: CampaignAssignment[];
  /** PC는 진행 상태 열 머리글을 "캠페인 진행 상태"로, 열이 좁은 TAB은 "진행 상태"로 씀(시안). */
  isStatusHeaderLong: boolean;
  onChangeAssignment: (campaignIdx: number, next: boolean) => void;
}

// Figma 캠페인 할당 표(10061:201588): 캠페인명 가변 | 상품 유형 | 세부 상품 | 진행 상태(배지) | 담당 여부(Switch sm), 행 높이 56.
// 열 폭은 PC 368·200×4, TAB 230·110×4(표 폭에 맞춰 2:1 비율로 둠).
export function CampaignAssignmentTable({
  campaigns,
  isStatusHeaderLong,
  onChangeAssignment,
}: CampaignAssignmentTableProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const label = useCodeLabel();

  return (
    <Table
      headerTone="gray"
      className="table-fixed"
      aria-label={t("access.campaign.title")}
    >
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t("access.campaign.column.name")}</TableHead>
          <TableHead className="w-27.5 desktop:w-50">
            {t("access.campaign.column.productType")}
          </TableHead>
          <TableHead className="w-27.5 desktop:w-50">
            {t("access.campaign.column.detailType")}
          </TableHead>
          <TableHead className="w-27.5 desktop:w-50">
            {isStatusHeaderLong
              ? t("access.campaign.column.status")
              : t("access.campaign.column.statusShort")}
          </TableHead>
          <TableHead className="w-27.5 desktop:w-50">
            {t("access.campaign.column.assigned")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.campaignIdx}>
            <TableCell className="whitespace-normal">
              <FullTextHint text={campaign.name} />
            </TableCell>
            <TableCell className="truncate">
              {label.productType(campaign.productType)}
            </TableCell>
            <TableCell className="truncate">
              {label.detailType(campaign.detailType)}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(campaign.status)}>
                {label.status(campaign.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Switch
                size="sm"
                checked={campaign.isAssigned}
                aria-label={t("access.campaign.switchLabel", {
                  name: campaign.name,
                })}
                onCheckedChange={(next) =>
                  onChangeAssignment(campaign.campaignIdx, next)
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
