import type {
  CampaignPlatform,
  CampaignProductType,
} from "@/entities/campaign";
import type { PlatformIconName } from "@/shared/components/platform-icon";

/** 캠페인 플랫폼 코드 → 공용 플랫폼 아이콘(스펙 §3 3단계: 아이콘만 `PlatformIcon`을 함께 씀). */
export const PLATFORM_ICON_NAMES = {
  INSTAGRAM: "instagram",
  NAVER_BLOG: "naver",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
  X: "x",
  // 시안이 숏츠는 유튜브, 릴스는 인스타그램 로고를 씀.
  SHORTS: "youtube",
  REELS: "instagram",
} as const satisfies Record<CampaignPlatform, PlatformIconName>;

export const PLATFORM_LABEL_KEYS = {
  INSTAGRAM: "platform.INSTAGRAM",
  NAVER_BLOG: "platform.NAVER_BLOG",
  FACEBOOK: "platform.FACEBOOK",
  YOUTUBE: "platform.YOUTUBE",
  TIKTOK: "platform.TIKTOK",
  X: "platform.X",
  SHORTS: "platform.SHORTS",
  REELS: "platform.REELS",
} as const satisfies Record<CampaignPlatform, string>;

/** 브랜드형 3단계 플랫폼. 숏츠·릴스는 공구형 시안(3.0.1)에만 있음. */
export const BRAND_PLATFORMS = [
  "INSTAGRAM",
  "NAVER_BLOG",
  "FACEBOOK",
  "YOUTUBE",
  "TIKTOK",
  "X",
] as const satisfies readonly CampaignPlatform[];

/** 공구형 3단계 플랫폼 순서(시안 3.0.1). */
export const GROUP_BUY_PLATFORMS = [
  "INSTAGRAM",
  "NAVER_BLOG",
  "YOUTUBE",
  "TIKTOK",
  "FACEBOOK",
  "X",
  "SHORTS",
  "REELS",
] as const satisfies readonly CampaignPlatform[];

/** 공구형은 "네이버 블로그", 그 밖은 "블로그"로 보임. */
export function getPlatformLabelKey(
  platform: CampaignPlatform,
  productType: CampaignProductType | null,
) {
  if (productType === "GROUP_BUY" && platform === "NAVER_BLOG") {
    return "platformGroupBuy.NAVER_BLOG";
  }
  return PLATFORM_LABEL_KEYS[platform];
}
