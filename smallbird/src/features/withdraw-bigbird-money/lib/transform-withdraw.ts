import { parseServerDate } from "@/entities/account";

import type { WithdrawResult } from "../model/schema";
import type { withdrawResponseSchema } from "../model/schema";
import type { z } from "zod";

/** 일시를 읽지 못하면 접수된 지금 시각으로 보여 줌(요청은 이미 성공했으므로 알럿을 막지 않음). */
export function transformWithdraw(
  response: z.infer<typeof withdrawResponseSchema>,
): WithdrawResult {
  return {
    id: response.id,
    requestedAt: parseServerDate(response.requestDate) ?? new Date(),
    amount: response.amount,
  };
}
