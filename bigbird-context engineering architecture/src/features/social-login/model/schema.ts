import { z } from "zod";

export const socialPlatformSchema = z.enum([
  "kakao",
  "naver",
  "google",
  "apple",
]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

/** 제공사에서 연동·가입 화면으로 넘기는 신원 정보. */
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

/** C01은 성공, C02는 먼저 연동해야 하는 미가입 SNS 계정. */
export type SocialLoginOutcome =
  | { status: "success" }
  | { status: "needsLink"; snsData: SocialLoginPayload }
  | { status: "failed" };
