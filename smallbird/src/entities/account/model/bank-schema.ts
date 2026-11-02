import { z } from "zod";

/** `GET /v3/mypage/account/bank/list`. 계좌 등록(계정 설정)과 빅버드 머니 출금이 같은 목록을 씀. */
export const bankListSchema = z.object({
  bankList: z.array(z.object({ idx: z.number(), name: z.string() })),
});

export interface BankOption {
  idx: number;
  name: string;
}
