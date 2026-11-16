import { z } from "zod";

/** `GET /v3/campaign` 응답의 한 항목(API A-2 + 현황이 요청한 부제·썸네일·기간·데모 필드). 모르는 코드도 읽도록 코드는 문자열로 받음. */
export const campaignListItemSchema = z.object({
  campaignIdx: z.number(),
  campaignCode: z.string(),
  serviceType: z.string(),
  productType: z.string(),
  status: z.string(),
  name: z.string(),
  brandName: z.string().nullish(),
  description: z.string().nullish(),
  thumbnailUrl: z.string().nullish(),
  /** 승인 전(등록 중·승인 대기·승인 반려)에는 희망 일정. */
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  demo: z.boolean(),
  demoCompleted: z.boolean(),
  /** 이전 캠페인 불러오기 표가 쓰는 칸(A-2). 현황 목록은 쓰지 않음. */
  campaignType: z.string().nullish(),
  platform: z.string().nullish(),
  /** 등록일 `yyyy-MM-dd HH:mm:ss`. */
  createdDate: z.string().nullish(),
});
export type CampaignListItem = z.infer<typeof campaignListItemSchema>;

export const campaignListSchema = z.object({
  list: z.array(campaignListItemSchema),
  count: z.number(),
  currentPage: z.number(),
  entrySize: z.number(),
});
export type CampaignListResponse = z.infer<typeof campaignListSchema>;
