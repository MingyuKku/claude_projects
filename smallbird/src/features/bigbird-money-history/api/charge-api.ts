import { serverApiV3 } from "@/shared/api";

import { transformChargeList } from "../lib/transform-charge";
import { chargeListSchema } from "../model/charge-schema";

import type { ChargeQuery } from "../model/charge-types";

/** `POST /v3/mypage/bigbird-money/charge`. 충전·출금 건을 한 목록으로 받고 구분·기간·상태 조건을 함께 걸 수 있음(docs/mypage-api.md §2). */
export async function fetchChargeList(query: ChargeQuery) {
  const response = await serverApiV3.post(
    "/mypage/bigbird-money/charge",
    query,
  );
  return transformChargeList(chargeListSchema.parse(response));
}
