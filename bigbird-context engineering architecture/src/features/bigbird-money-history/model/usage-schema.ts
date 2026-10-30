import { z } from "zod";

/** `POST /v3/mypage/biz-money/usage` 응답의 항목. 값이 없으면 null이 올 수 있어 문자열은 모두 느슨하게 읽음. */
export const usageItemSchema = z.object({
  usageType: z.string().nullish(),
  usageDetails: z.string().nullish(),
  usageDate: z.string().nullish(),
  campaignName: z.string().nullish(),
  campaignCode: z.string().nullish(),
  campaignService: z.string().nullish(),
  code: z.string().nullish(),
  usageAmount: z.number().nullish(),
  remainingAmount: z.number().nullish(),
});

export const usageListSchema = z.object({
  list: z.array(usageItemSchema),
  count: z.number(),
  currentPage: z.number(),
  entrySize: z.number(),
});

export type UsageList = z.infer<typeof usageListSchema>;
