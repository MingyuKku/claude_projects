import { z } from "zod";

/** `GET /v3/mypage/biz-money` 응답. 화면은 `bizMoney`만 읽음. */
export const bigbirdMoneyBalanceSchema = z.object({
  bizMoney: z.number(),
});

export interface BigbirdMoneyBalance {
  amount: number;
}
