import { ROUTES } from "@/shared/config";

import type { CreatorPlatform } from "@/entities/platform";

interface BuildCreatorSearchUrlInput {
  query: string;
  platform?: CreatorPlatform;
}

/** 검색 결과 경로의 URL. 문구는 검색 화면의 `keyword`로 넘김. 문구는 앞뒤 공백을 지우고, 플랫폼을 고르지 않았으면 `platform` 쿼리를 뺌. */
export function buildCreatorSearchUrl({
  query,
  platform,
}: BuildCreatorSearchUrlInput) {
  const params = new URLSearchParams({ keyword: query.trim() });
  if (platform) params.set("platform", platform);
  return `${ROUTES.creatorSearch}?${params.toString()}`;
}
