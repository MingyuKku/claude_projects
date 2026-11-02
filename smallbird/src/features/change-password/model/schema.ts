import { z } from "zod";

export const changePasswordResultSchema = z.object({ result: z.string() });
export type ChangePasswordResult = z.infer<typeof changePasswordResultSchema>;

/** 번역 키(`submitError.{code}`). */
export type ChangeSubmitErrorCode =
  | "submitRequired"
  | "containsId"
  | "containsPersonalInfo"
  | "timeOut"
  | "fallback";

export const changePasswordErrorSchema = z.object({
  message: z.string().optional(),
});
