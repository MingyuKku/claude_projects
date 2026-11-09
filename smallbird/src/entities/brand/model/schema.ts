import { z } from "zod";

/** `GET /v3/campaign/brands`(A-4) 항목이자 브랜드 추가(A-5) 응답. */
export const brandSchema = z.object({
  brandIdx: z.number().int(),
  nameKo: z.string(),
  nameEn: z.string(),
  /** 없으면 `null`이고 화면이 기본 프로필을 그림. */
  imageUrl: z.string().nullable(),
});
export type Brand = z.infer<typeof brandSchema>;
