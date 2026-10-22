import { z } from "zod";

/** `GET /v3/mypage/account/extra/category`. 최상위 분류만 씀(하위 분류 API는 쓰지 않음). */
export const companyCategoryListSchema = z.object({
  category: z.array(z.object({ idx: z.number(), name: z.string() })),
});
