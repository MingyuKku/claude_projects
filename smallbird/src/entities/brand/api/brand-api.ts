import { serverApiV3 } from "@/shared/api";

import { brandListSchema, brandSchema } from "../model/schema";

import type { Brand } from "../model/schema";

/** A-6.1 `GET /v3/brand`. 지우지 않은 내 브랜드 전체(최근 추가순). */
export async function fetchBrands(): Promise<Brand[]> {
  return brandListSchema.parse(await serverApiV3.get("/brand")).brands;
}

/** A-6.2 `POST /v3/brand`. 이미지를 올리지 않으면 응답의 `imageUrl`이 `null`이고 화면이 기본 프로필을 그림. */
export async function addBrand(input: {
  name: string;
  /** A-7로 먼저 올린 이미지 번호. 없으면 `null`. */
  imageAttachmentIdx: number | null;
}): Promise<Brand> {
  return brandSchema.parse(await serverApiV3.post("/brand", input));
}

/** A-6.3 `DELETE /v3/brand/{brandIdx}`. 없거나 이미 지운 브랜드면 404 `BRAND_NOT_FOUND`. */
export async function deleteBrand(brandIdx: number): Promise<void> {
  await serverApiV3.delete(`/brand/${brandIdx}`);
}
