import { z } from "zod";

// V3 Swagger `V3-마이페이지`(2026-10-23)의 Sub ID 목록·권한 스키마. 서버 필드명은 이 파일과 트랜스포머 안에서만 씀.

const pagingInfoSchema = z.object({
  page: z.number(),
  totalCount: z.number(),
  totalPage: z.number(),
});

const subAccountSchema = z.object({
  idx: z.number(),
  identifier: z.string(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  created: z.string().nullish(),
  profileImageUrl: z.string().nullish(),
});

/** `GET /v3/mypage/account/sub`(`SubAccountListResponse`). */
export const subAccountListSchema = z.object({
  sub: z.array(subAccountSchema).nullish(),
  pagingInfo: pagingInfoSchema,
});
export type SubAccountList = z.infer<typeof subAccountListSchema>;

/** `GET·PUT /v3/mypage/account/authorization`(`SubAccountAuthorizationV3Response`, 권한 6개 · 2026-10-27 배포). */
export const subAccountAuthorizationSchema = z.object({
  accountIdx: z.number(),
  isCampaignAccess: z.boolean(),
  isInfluencerMatchingAccess: z.boolean(),
  isInfluencerMarketAccess: z.boolean(),
  isCommerceAccess: z.boolean(),
  isBigbirdMoneyAccess: z.boolean(),
  isPurchaserQuestionAccess: z.boolean(),
});
export type SubAccountAuthorization = z.infer<
  typeof subAccountAuthorizationSchema
>;
