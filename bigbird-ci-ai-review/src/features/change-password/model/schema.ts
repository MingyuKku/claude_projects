import { z } from "zod";

export const changePasswordResultSchema = z.object({ result: z.string() });
export type ChangePasswordResult = z.infer<typeof changePasswordResultSchema>;

export const changePasswordErrorSchema = z.object({
  message: z.string().optional(),
});
