import { serverApiV3 } from "@/shared/api";

import { transformBalance } from "../lib/transform-balance";
import { bigbirdMoneyBalanceSchema } from "../model/schema";

/** `GET /v3/mypage/biz-money`. 현재 보유 빅버드 머니(v2 `GET /biz` 재사용). */
export async function fetchBigbirdMoneyBalance() {
  const response = await serverApiV3.get("/mypage/biz-money");
  return transformBalance(bigbirdMoneyBalanceSchema.parse(response));
}
