import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import type { UsageRecord } from "../model/usage-types";

// Figma 사용 내역 캠페인 명 칸의 40px 썸네일(PC 표 11224:103786, TAB·MO 카드). 이미지가 없거나 열리지 않으면 기본 이미지.
// 충전·출금은 캠페인 명이 빈칸이라 썸네일도 그리지 않음.
export function CampaignThumbnail({ record }: { record: UsageRecord }) {
  if (record.campaignName === "") return null;

  return (
    <Avatar size="md" shape="rounded">
      {record.campaignImageUrl && (
        <AvatarImage src={record.campaignImageUrl} alt="" />
      )}
      <AvatarPlaceholder />
    </Avatar>
  );
}
