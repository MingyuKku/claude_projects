import { serverApiV3 } from "@/shared/api";

import { transformChargeList } from "../lib/transform-charge";
import { chargeListSchema } from "../model/charge-schema";
import { LIST_PAGE_SIZE } from "../model/constants";

/**
 * `POST /v3/mypage/biz-money/charge`. 서버 기본 `entrySize`가 5라 10을 명시함.
 * 필터(`searchType`+`keyword`)는 기간 검색·조건 동시 적용이 지원되기 전까지 보내지 않음(docs/mypage-api.md §4-16).
 */
export async function fetchChargeList(page: number) {
  const response = await serverApiV3.post("/mypage/biz-money/charge", {
    page,
    entrySize: LIST_PAGE_SIZE,
  });
  return transformChargeList(chargeListSchema.parse(response));
}
