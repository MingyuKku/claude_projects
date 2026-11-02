import { z } from "zod";

/** `GET /v3/mypage/bigbird-money` 응답. 사유(`ZERO_BALANCE`·`PENDING_WITHDRAWAL`)는 화면이 쓰지 않아 코드를 좁히지 않음. */
export const bigbirdMoneyBalanceSchema = z.object({
  bigbirdMoney: z.number(),
  withdrawable: z.boolean(),
  withdrawUnavailableReason: z.string().nullable(),
});

export interface BigbirdMoneyBalance {
  amount: number;
  /** 지금 출금을 요청할 수 있는지. false면 "출금하기"를 막음. */
  isWithdrawable: boolean;
}
