// 크리에이터 검색에서 고를 수 있는 플랫폼. 표시 순서는 Figma 드롭다운(5180:87540)을 따름.
export const CREATOR_PLATFORMS = [
  "instagram",
  "naver",
  "tiktok",
  "facebook",
] as const;

export type CreatorPlatform = (typeof CREATOR_PLATFORMS)[number];

export function isCreatorPlatform(value: unknown): value is CreatorPlatform {
  return CREATOR_PLATFORMS.some((platform) => platform === value);
}
