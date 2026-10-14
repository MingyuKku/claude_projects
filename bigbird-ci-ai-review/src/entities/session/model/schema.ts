import { z } from "zod";

/** MASTER and ADMIN have every permission; SUB is limited by the flags below. */
export const authoritySchema = z.enum(["MASTER", "ADMIN", "SUB"]);
export type Authority = z.infer<typeof authoritySchema>;

/** Response of `GET /sec`. Only fields that guards and layout shells read are modelled. */
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
  nickname: z.string().nullable(),
  identifier: z.string(),
  email: z.string(),
  phone: z.string(),
  // Sent for SUB accounts only; keys are kept as the server names them.
  isRequestCampaignAccess: z.boolean().optional(),
  isOpenShopAccess: z.boolean().optional(),
  isCurrentSituationAccess: z.boolean().optional(),
  isSettlementAccess: z.boolean().optional(),
  isCustomerServiceAccess: z.boolean().optional(),
});
export type Session = z.infer<typeof sessionSchema>;

export interface SubPermissions {
  requestCampaign: boolean;
  openShop: boolean;
  currentSituation: boolean;
  settlement: boolean;
  customerService: boolean;
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
  phone: string;
  subPermissions: SubPermissions;
}

export const formLoginResultSchema = z.object({
  result: z.boolean(),
  reason: z.string().optional(),
  userIdx: z.number().optional(),
  authority: z.string().optional(),
});
export type FormLoginResult = z.infer<typeof formLoginResultSchema>;
