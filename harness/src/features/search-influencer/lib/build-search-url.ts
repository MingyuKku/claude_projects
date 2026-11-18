import { ROUTES } from "@/shared/config";

import type { InfluencerPlatform } from "@/entities/platform";

interface BuildInfluencerSearchUrlInput {
  query: string;
  platform?: InfluencerPlatform;
}

/** 검색 결과 경로의 URL. 문구는 앞뒤 공백을 지우고, 플랫폼을 고르지 않았으면 `platform` 쿼리를 뺌. */
export function buildInfluencerSearchUrl({
  query,
  platform,
}: BuildInfluencerSearchUrlInput) {
  const params = new URLSearchParams({ q: query.trim() });
  if (platform) params.set("platform", platform);
  return `${ROUTES.influencerSearch}?${params.toString()}`;
}
