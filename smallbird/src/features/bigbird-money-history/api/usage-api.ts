import { serverApiV3 } from "@/shared/api";

import { transformUsageList } from "../lib/transform-usage";
import { LIST_PAGE_SIZE } from "../model/constants";
import { usageListSchema } from "../model/usage-schema";

/**
 * `POST /v3/mypage/biz-money/usage`. 서버 기본 `entrySize`가 8이라 10을 명시함.
 * 필터(`searchType`+`keyword`)는 기간 검색·조건 동시 적용이 지원되기 전까지 보내지 않음(docs/mypage-api.md §4-16).
 */
export async function fetchUsageList(page: number) {
  const response = await serverApiV3.post("/mypage/biz-money/usage", {
    page,
    entrySize: LIST_PAGE_SIZE,
  });
  return transformUsageList(usageListSchema.parse(response));
}
