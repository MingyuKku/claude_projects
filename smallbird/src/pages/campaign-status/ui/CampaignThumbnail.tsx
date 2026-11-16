import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

// 캠페인 명 옆 40px 썸네일(5단계 메인 이미지). 이미지가 없거나 열리지 않으면 기본 이미지.
export function CampaignThumbnail({ imageUrl }: { imageUrl: string | null }) {
  return (
    <Avatar size="md" shape="rounded" className="border">
      {imageUrl && <AvatarImage src={imageUrl} alt="" />}
      <AvatarPlaceholder />
    </Avatar>
  );
}
