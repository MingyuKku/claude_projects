import { z } from "zod";

/** Member backend reply for `/find/*`. `url` is the one-time reset link of `/find/pw/email`. */
export const findResponseSchema = z.object({
  result: z.string(),
  id: z.string().optional(),
  count: z.number().optional(),
  url: z.string().optional(),
});
export type FindResponse = z.infer<typeof findResponseSchema>;

// The auth server reports failure as `{ success: false, data: { code } }`, sometimes
// with HTTP 200, so both branches must be modelled instead of relying on status.
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
