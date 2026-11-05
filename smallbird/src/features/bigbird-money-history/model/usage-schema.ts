import { z } from "zod";

/**
 * `POST /v3/mypage/bigbird-money/usage` 응답의 항목(사용·환급·충전·출금 건이 한 목록, docs/mypage-api.md §2). 화면이 읽는 필드만 둠.
 * 구분·캠페인 유형·사용 내역은 코드지만 모르는 값이 와도 화면을 깨뜨리지 않게 문자열로 읽고 트랜스포머가 바꿈. 값이 없으면 null.
 */
export const usageItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  usageDate: z.string().nullish(),
  campaignName: z.string().nullish(),
  campaignCode: z.string().nullish(),
  campaignType: z.string().nullish(),
  mainImageUrl: z.string().nullish(),
  usageDetailCode: z.string().nullish(),
  usageDetailName: z.string().nullish(),
  usageAmount: z.number().nullish(),
  remainingAmount: z.number().nullish(),
  contractTarget: z
    .object({
      name: z.string().nullish(),
      influencerId: z.string().nullish(),
    })
    .nullish(),
});

export const usageListSchema = z.object({
  list: z.array(usageItemSchema),
  count: z.number(),
  currentPage: z.number(),
  entrySize: z.number(),
});

/** `GET /v3/mypage/bigbird-money/usage/filter-options` 응답. 사용 내역은 번역이 있는 코드면 번역을, 없으면 서버 `name`을 보임. */
export const usageFilterOptionsSchema = z.object({
  campaigns: z.array(
    z.object({
      campaignIdx: z.number(),
      campaignName: z.string(),
    }),
  ),
  usageDetails: z.array(z.object({ code: z.string(), name: z.string() })),
});

export type UsageList = z.infer<typeof usageListSchema>;
export type UsageFilterOptions = z.infer<typeof usageFilterOptionsSchema>;
