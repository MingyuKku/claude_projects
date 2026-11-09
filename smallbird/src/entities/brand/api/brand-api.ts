import { brandSchema } from "../model/schema";

import type { Brand } from "../model/schema";

// 요구 명세 A-4·A-5. API가 없는 동안은 개발 서버에서만 목이 응답함(`entities/campaign`의 `load-mock-api`와 같은 방식).
async function loadMockBrandApi() {
  if (!import.meta.env.DEV) {
    throw new Error("The brand API is not available yet.");
  }
  return import("./mock/brand-mock");
}

/** A-4 `GET /v3/campaign/brands`. 이 광고주가 등록한 브랜드(최근 추가순). */
export async function fetchBrands(): Promise<Brand[]> {
  const mock = await loadMockBrandApi();
  return (await mock.listBrands()).map((brand) => brandSchema.parse(brand));
}

/** A-5 `POST /v3/campaign/brands`. 이미지를 올리지 않으면 응답의 `imageUrl`이 `null`이고 화면이 기본 프로필을 그림. */
export async function addBrand(input: {
  nameKo: string;
  nameEn: string;
  /** A-8로 먼저 올린 파일(`kind=BRAND_IMAGE`). 없으면 `null`. */
  imageFileId: string | null;
}): Promise<Brand> {
  const mock = await loadMockBrandApi();
  return brandSchema.parse(await mock.createBrand(input));
}
