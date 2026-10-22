import { z } from "zod";

import { socialLoginPayloadSchema } from "@/features/social-login";

/** 소셜 로그인 콜백 화면이 라우터 state로 넘기는 값. URL로 직접 들어오면 없음. */
export const snsLinkStateSchema = z.object({
  snsData: socialLoginPayloadSchema,
});
