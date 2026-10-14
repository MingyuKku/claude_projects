import { z } from "zod";

export const socialPlatformSchema = z.enum([
  "kakao",
  "naver",
  "google",
  "apple",
]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

/** Identity handed from a provider to the link/sign-up screens. */
export const socialLoginPayloadSchema = z.object({
  platform: z.string(),
  uid: z.string().optional(),
  email: z.string().optional(),
});
export type SocialLoginPayload = z.infer<typeof socialLoginPayloadSchema>;

export const socialLoginResponseSchema = z.object({
  data: z.object({
    code: z.string(),
    tokenResponse: z
      .object({
        tokenType: z.string().optional(),
        accessToken: z.string().optional(),
        uid: z.string().optional(),
        email: z.string().optional(),
      })
      .optional(),
  }),
});
export type SocialLoginResponse = z.infer<typeof socialLoginResponseSchema>;

export const socialLinkResultSchema = z.object({ code: z.number() });
export type SocialLinkResult = z.infer<typeof socialLinkResultSchema>;

/** C01 is success; C02 is an unregistered SNS account that must be linked first. */
export type SocialLoginOutcome =
  | { status: "success" }
  | { status: "needsLink"; snsData: SocialLoginPayload }
  | { status: "failed" };
