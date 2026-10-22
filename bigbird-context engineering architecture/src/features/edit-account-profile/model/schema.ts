import { z } from "zod";

/** `GET /v3/mypage/account/profile`. 화면은 이미지 주소만 읽음. */
export const profileImageResponseSchema = z.object({
  profileUrl: z.string().nullish(),
});
