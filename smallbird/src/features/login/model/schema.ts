import { z } from "zod";

// time 형태가 어긋나도 reason으로 잠금·만료를 가를 수 있도록 필드별로 버림.
export const loginErrorDataSchema = z.object({
  reason: z.string().optional().catch(undefined),
  /** 잠금 해제 시각 또는 계정 만료 시각(ISO 문자열). */
  time: z.string().optional().catch(undefined),
});
export type LoginErrorData = z.infer<typeof loginErrorDataSchema>;
