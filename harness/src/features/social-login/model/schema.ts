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

/**
 * 소셜 로그인이 실패해 로그인 화면으로 돌아갈 때 넘기는 router state. 로그인 화면이 실패 안내를 보이는 데 씀.
 * 카카오·네이버·구글은 복귀 화면에서, 애플은 팝업 뒤 같은 화면에서 실패를 알림.
 */
export const snsLoginFailedStateSchema = z.object({
  snsLoginFailed: z.literal(true),
});
export const SNS_LOGIN_FAILED_STATE: z.infer<typeof snsLoginFailedStateSchema> =
  { snsLoginFailed: true };

/** V3 간편 로그인 결과. `needsLink`는 미가입 SNS 계정(`404 NEED_SIGNUP`)이라 `snsLinkToken`을 들고 연동 화면으로 감. */
export type SocialLoginOutcome =
  | { status: "success" }
  | { status: "needsLink"; snsData: SocialLoginPayload }
  | { status: "failed" };
