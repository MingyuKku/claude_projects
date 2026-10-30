import { z } from "zod";

/** `POST /v3/mypage/biz-money/charge` 응답의 항목. 화면이 읽는 필드만 둠. 값이 없으면 null·`N/A`가 올 수 있어 느슨하게 읽음. */
export const chargeItemSchema = z.object({
  requestDate: z.string().nullish(),
  expiredDate: z.string().nullish(),
  requestAmount: z.number().nullish(),
  bankName: z.string().nullish(),
  accountNumber: z.string().nullish(),
  depositDate: z.string().nullish(),
  depositState: z.string().nullish(),
  receiptUrl: z.string().nullish(),
  payMethod: z.string().nullish(),
});

export const chargeListSchema = z.object({
  list: z.array(chargeItemSchema),
  count: z.number(),
  currentPage: z.number(),
  entrySize: z.number(),
});

export type ChargeList = z.infer<typeof chargeListSchema>;
