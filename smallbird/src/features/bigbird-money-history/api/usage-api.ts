import { serverApiV3 } from "@/shared/api";

import { transformUsageList } from "../lib/transform-usage";
import {
  usageFilterOptionsSchema,
  usageListSchema,
} from "../model/usage-schema";

import type { UsageQuery } from "../model/usage-types";

/** `POST /v3/mypage/bigbird-money/usage`. 사용·환급·충전·출금 건을 한 목록으로 받고 구분·기간·캠페인·사용 내역 조건을 함께 걸 수 있음(docs/mypage-api.md §2). */
export async function fetchUsageList(query: UsageQuery) {
  const response = await serverApiV3.post("/mypage/bigbird-money/usage", query);
  return transformUsageList(usageListSchema.parse(response));
}

/** `GET /v3/mypage/bigbird-money/usage/filter-options`. 캠페인 명 Select의 선택지(이 광고주가 빅버드 머니를 쓴 캠페인, 최근 사용순). */
export async function fetchUsageFilterOptions() {
  const response = await serverApiV3.get(
    "/mypage/bigbird-money/usage/filter-options",
  );
  return usageFilterOptionsSchema.parse(response);
}
