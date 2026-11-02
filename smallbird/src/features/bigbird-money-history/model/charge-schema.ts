import { z } from "zod";

/**
 * `POST /v3/mypage/bigbird-money/charge` 응답의 항목(충전·출금 건이 한 목록, docs/mypage-api.md §2). 화면이 읽는 필드만 둠.
 * 구분·상태는 코드지만 모르는 값이 와도 화면을 깨뜨리지 않게 문자열로 읽고 트랜스포머가 바꿈. 값이 없으면 null.
 */
export const chargeItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  requestDate: z.string().nullish(),
  completedDate: z.string().nullish(),
  amount: z.number().nullish(),
  payMethod: z.string().nullish(),
  bankName: z.string().nullish(),
  accountNumber: z.string().nullish(),
  holderName: z.string().nullish(),
  receiptUrl: z.string().nullish(),
});

export const chargeListSchema = z.object({
  list: z.array(chargeItemSchema),
  count: z.number(),
  currentPage: z.number(),
  entrySize: z.number(),
});

export type ChargeList = z.infer<typeof chargeListSchema>;
