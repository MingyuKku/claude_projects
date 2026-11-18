import type { CampaignPlatform } from "@/entities/campaign";
import type { PlatformIconName } from "@/shared/components/platform-icon";

/** 캠페인 플랫폼 코드 → 공용 플랫폼 아이콘(스펙 §3 3단계: 아이콘만 `PlatformIcon`을 함께 씀). */
export const PLATFORM_ICON_NAMES = {
  INSTAGRAM: "instagram",
  NAVER_BLOG: "naver",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
  X: "x",
} as const satisfies Record<CampaignPlatform, PlatformIconName>;

export const PLATFORM_LABEL_KEYS = {
  INSTAGRAM: "platform.INSTAGRAM",
  NAVER_BLOG: "platform.NAVER_BLOG",
  FACEBOOK: "platform.FACEBOOK",
  YOUTUBE: "platform.YOUTUBE",
  TIKTOK: "platform.TIKTOK",
  X: "platform.X",
} as const satisfies Record<CampaignPlatform, string>;
