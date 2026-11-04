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
  email: z.string().optional(),
  /** V3 로그인이 준 서버 서명 신원(10분). 프론트는 내용을 읽지 않고 가입·연동 요청에 그대로 넘김. */
  snsLinkToken: z.string(),
});
export type SocialLoginPayload = z.infer<typeof socialLoginPayloadSchema>;

/** V3 간편 로그인의 `404 NEED_SIGNUP` 본문. 신원은 서버가 확인한 값이고 프론트는 `snsLinkToken`을 읽지 않고 넘김. */
export const needSignupResponseSchema = z.object({
  reason: z.literal("NEED_SIGNUP"),
  platform: z.string(),
  email: z.string().optional(),
  snsLinkToken: z.string(),
});

/** V3 간편 로그인 성공 응답. 세션은 쿠키로 열리므로 본문 값은 쓰지 않고 형태만 확인함. */
export const snsLoginV3ResponseSchema = z.object({
  userIdx: z.number(),
  authority: z.string().optional(),
});

/** C01은 성공, C02는 먼저 연동해야 하는 미가입 SNS 계정. */
export type SocialLoginOutcome =
  | { status: "success" }
  | { status: "needsLink"; snsData: SocialLoginPayload }
  | { status: "failed" };
