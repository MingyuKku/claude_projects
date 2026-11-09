import { useCampaignLabels } from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { formatCreatedDate, PlatformCell } from "./PreviousCampaignCells";

import type { PreviousCampaign } from "@/entities/campaign";

interface PreviousCampaignTableProps {
  campaigns: PreviousCampaign[];
  selectedCampaignIdx: number | null;
  onSelect: (campaignIdx: number | null) => void;
}

// PC 드로어의 목록(Figma 7555:333792): 체크박스 · 캠페인명 · 브랜드 · 유형 · 플랫폼 · 등록일. 한 개만 고르고(체크박스는 행마다),
// 머리글의 전체 선택 체크박스는 그리지 않음(시안 오류, REQ-8-0011).
export function PreviousCampaignTable({
  campaigns,
  selectedCampaignIdx,
  onSelect,
}: PreviousCampaignTableProps) {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();

  return (
    <Table
      size="xs"
      headerTone="gray"
      isFirstColumnSticky={false}
      containerClassName="rounded-none border-0"
    >
      <TableHeader>
        <TableRow>
          <TableHead className="w-12" />
          <TableHead className="w-42.5">
            {t("loadPrevious.column.name")}
          </TableHead>
          <TableHead className="w-40">
            {t("loadPrevious.column.brand")}
          </TableHead>
          <TableHead className="w-30">
            {t("loadPrevious.column.type")}
          </TableHead>
          <TableHead className="w-37.5">
            {t("loadPrevious.column.platform")}
          </TableHead>
          <TableHead>{t("loadPrevious.column.createdDate")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => {
          const isSelected = campaign.campaignIdx === selectedCampaignIdx;
          return (
            <TableRow
              key={campaign.campaignIdx}
              data-state={isSelected ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  aria-label={t("loadPrevious.select", { name: campaign.name })}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onSelect(checked === true ? campaign.campaignIdx : null)
                  }
                />
              </TableCell>
              <TableCell>{campaign.name}</TableCell>
              <TableCell>{campaign.brandName}</TableCell>
              <TableCell>
                {campaign.campaignType === null
                  ? null
                  : labels.campaignType(campaign.campaignType)}
              </TableCell>
              <TableCell>
                <PlatformCell platform={campaign.platform} hasName />
              </TableCell>
              <TableCell>{formatCreatedDate(campaign.createdDate)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
