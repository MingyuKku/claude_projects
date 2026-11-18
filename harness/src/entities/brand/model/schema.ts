import { z } from "zod";

/** `GET /v3/brand`(A-6.1) 항목이자 브랜드 추가(A-6.2) 응답. 브랜드명은 국문·영문 구분 없이 한 칸(REQ-10-0018). */
export const brandSchema = z.object({
  brandIdx: z.number().int(),
  name: z.string(),
  /** 없으면 `null`이고 화면이 기본 프로필을 그림. */
  imageUrl: z.string().nullable(),
});
export type Brand = z.infer<typeof brandSchema>;

export const brandListSchema = z.object({ brands: z.array(brandSchema) });
