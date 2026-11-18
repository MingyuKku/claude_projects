import type { BigbirdMoneyBalance } from "../model/schema";
import type { bigbirdMoneyBalanceSchema } from "../model/schema";
import type { z } from "zod";

export function transformBalance(
  response: z.infer<typeof bigbirdMoneyBalanceSchema>,
): BigbirdMoneyBalance {
  return {
    amount: response.bigbirdMoney,
    isWithdrawable: response.withdrawable,
  };
}
