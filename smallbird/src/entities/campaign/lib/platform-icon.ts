import type { CampaignPlatform } from "../model/codes";
import type { PlatformIconName } from "@/shared/components/platform-icon";

// 캠페인 플랫폼 코드 → 로고. 블로그는 네이버 로고를 씀.
const ICON_BY_PLATFORM: Record<CampaignPlatform, PlatformIconName> = {
  INSTAGRAM: "instagram",
  NAVER_BLOG: "naver",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
  X: "x",
};

export function getCampaignPlatformIcon(
  platform: CampaignPlatform,
): PlatformIconName {
  return ICON_BY_PLATFORM[platform];
}
