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

/** 매칭 API의 플랫폼 번호(platformIdx 1~5 고정)와 로고 코드. 모르는 번호는 null. */
const MATCHING_PLATFORM_BY_IDX = [
  "instagram",
  "naver",
  "youtube",
  "x",
  "tiktok",
] as const;

export type MatchingPlatformName = (typeof MATCHING_PLATFORM_BY_IDX)[number];

export function toMatchingPlatform(
  platformIdx: number,
): MatchingPlatformName | null {
  return MATCHING_PLATFORM_BY_IDX[platformIdx - 1] ?? null;
}
