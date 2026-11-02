import { z } from "zod";

// Stage OpenAPI: UserListResponse · ClientListItemResponse · SimpleResultResponse.
export const switchAccountListSchema = z.object({
  clientList: z.array(
    z.object({
      id: z.string(),
      user_idx: z.number().int(),
      // 실제 Stage 응답에는 회사명이 null인 계정이 있다.
      company_name: z.string().nullish(),
    }),
  ),
});
export type SwitchAccountList = z.infer<typeof switchAccountListSchema>;
export const switchAccountResultSchema = z.object({ result: z.boolean() });
export const switchAccountRequestSchema = z.object({
  userIdx: z.number().int(),
});
export type SwitchAccountRequest = z.infer<typeof switchAccountRequestSchema>;

export interface SwitchAccountViewModel {
  identifier: string;
  userIdx: number;
  companyName: string;
}
