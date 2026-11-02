// 인플루언서 검색에서 고를 수 있는 플랫폼. 표시 순서는 Figma 드롭다운(5180:87540)을 따름.
export const INFLUENCER_PLATFORMS = [
  "instagram",
  "naver",
  "tiktok",
  "facebook",
] as const;

export type InfluencerPlatform = (typeof INFLUENCER_PLATFORMS)[number];

export function isInfluencerPlatform(
  value: unknown,
): value is InfluencerPlatform {
  return INFLUENCER_PLATFORMS.some((platform) => platform === value);
}
