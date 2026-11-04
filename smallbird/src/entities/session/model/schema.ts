import { z } from "zod";

/** MASTER and ADMIN have every menu permission; SUB is limited by the flags the server sends. */
export const authoritySchema = z.enum(["MASTER", "ADMIN", "SUB"]);
export type Authority = z.infer<typeof authoritySchema>;

/** Response of `GET /v3/sec`. Only fields that guards and layout shells read are modelled. */
export const sessionSchema = z.object({
  /**
   * Whether the server allowed the `X-Path` route. This is an authorization
   * result, not authentication: a logged-in user can still get false.
   */
  result: z.boolean(),
  userIdx: z.number(),
  accountIdx: z.number(),
  threadUserIdx: z.number(),
  authority: authoritySchema,
  service: z.string(),
  // stage ADMIN 계정 응답에는 nickname·phone 키가 아예 없음.
  nickname: z.string().nullish(),
  identifier: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  // SUB 계정일 때만 오는 본인 이름. 연락처는 `phone`.
  name: z.string().nullish(),
  // 메뉴 권한 7개(LNB 노출용). MASTER·ADMIN은 모두 true, SUB는 마스터가 정한 값이고 호출할 때마다 새로 읽음.
  // 진입이 거부된 경로는 403이라 오지 않으므로 없으면 false로 읽음.
  isCampaignAccess: z.boolean().optional(),
  isInfluencerMatchingAccess: z.boolean().optional(),
  isInfluencerMarketAccess: z.boolean().optional(),
  isCommerceAccess: z.boolean().optional(),
  isBigbirdMoneyAccess: z.boolean().optional(),
  isPurchaserQuestionAccess: z.boolean().optional(),
  // 구매자 문의와 별도 권한(2026-10-30). Swagger상 DB 컬럼이 아직 없어 SUB는 항상 false로 옴.
  isInfluencerQuestionAccess: z.boolean().optional(),
});
export type Session = z.infer<typeof sessionSchema>;

/** LNB 메뉴 접근 권한. 권한이 없는 Sub ID에게도 메뉴는 보이고 흐리게 비활성함(스펙 `main.md`). */
export interface MenuPermissions {
  campaign: boolean;
  influencerMatching: boolean;
  influencerMarket: boolean;
  commerce: boolean;
  bigbirdMoney: boolean;
  purchaserQuestion: boolean;
  influencerQuestion: boolean;
}

export interface SessionViewModel {
  isAllowed: boolean;
  userIdx: number;
  accountIdx: number;
  threadUserIdx: number;
  authority: Authority;
  service: string;
  displayName: string;
  identifier: string;
  email: string;
  phone?: string;
  permissions: MenuPermissions;
}

export const formLoginResultSchema = z.object({
  result: z.boolean(),
  reason: z.string().optional(),
  userIdx: z.number().optional(),
  authority: z.string().optional(),
});
export type FormLoginResult = z.infer<typeof formLoginResultSchema>;
