import { z } from "zod";

export const expiredPasswordResultSchema = z.object({ result: z.boolean() });
export type ExpiredPasswordResult = z.infer<typeof expiredPasswordResultSchema>;

export const expiredPasswordInputSchema = z.object({
  id: z.string(),
  originPW: z.string(),
  newPW: z.string(),
  newPWCheck: z.string(),
});
export type ExpiredPasswordInput = z.infer<typeof expiredPasswordInputSchema>;

export const expiredPasswordErrorSchema = z.object({
  reason: z.string().optional(),
});
