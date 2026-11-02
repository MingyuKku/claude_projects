import { z } from "zod";

/** `POST /v3/mypage/bigbird-money/withdraw` 200 응답. `requestDate`는 KST `yyyy-MM-dd HH:mm:ss`. */
export const withdrawResponseSchema = z.object({
  id: z.string(),
  requestDate: z.string(),
  amount: z.number(),
  status: z.string(),
  /** 요청 직후 잔액. 출금은 운영자가 처리할 때 빠지므로 요청 전과 같음. */
  balance: z.number(),
});

export interface WithdrawResult {
  id: string;
  requestedAt: Date;
  amount: number;
}
