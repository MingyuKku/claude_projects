import { z } from "zod";

/** `/find/*`에 대한 회원 백엔드 응답. `url`은 `/find/pw/email`의 일회용 재설정 링크. */
export const findResponseSchema = z.object({
  result: z.string(),
  id: z.string().optional(),
  count: z.number().optional(),
  url: z.string().optional(),
});
export type FindResponse = z.infer<typeof findResponseSchema>;

// 인증 서버는 실패를 `{ success: false, data: { code } }`로 알리고 HTTP 200일 때도 있어,
// 상태 코드에 기대지 않고 두 분기를 모두 스키마로 표현함.
function authResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({
      success: z.literal(false),
      data: z.object({ code: z.string(), message: z.string().optional() }),
    }),
  ]);
}

export const lookupResponseSchema = authResponseSchema(
  z.object({ id: z.number(), remainVerificationCount: z.number() }),
);
export type LookupResponse = z.infer<typeof lookupResponseSchema>;

export const verifyLoginIdResponseSchema = authResponseSchema(
  z.object({ loginId: z.string() }),
);
export type VerifyLoginIdResponse = z.infer<typeof verifyLoginIdResponseSchema>;

export const verifyPasswordResponseSchema = authResponseSchema(
  z.object({ resetPasswordCode: z.string() }),
);
export type VerifyPasswordResponse = z.infer<
  typeof verifyPasswordResponseSchema
>;
