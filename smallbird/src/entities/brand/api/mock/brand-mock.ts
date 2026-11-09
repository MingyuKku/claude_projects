import { createMockStore, getMockFileUrl } from "@/shared/lib";

import type { Brand } from "../../model/schema";

// 브랜드 목록·추가(A-4·A-5)의 목 저장소. 키와 항목 모양은 `entities/campaign`의 `brand-snapshot`이 읽으므로 함께 맞춰야 함.
interface BrandMockDb {
  nextBrandIdx: number;
  brands: Brand[];
}

const brandMockDb = createMockStore<BrandMockDb>("bigbird:mock:brands", () => ({
  nextBrandIdx: 4,
  brands: [
    {
      brandIdx: 3,
      nameKo: "빅링크 코스메틱",
      nameEn: "Biglink Cosmetic",
      imageUrl: null,
    },
    { brandIdx: 2, nameKo: "초록숲", nameEn: "Green Forest", imageUrl: null },
    {
      brandIdx: 1,
      nameKo: "데일리 스튜디오",
      nameEn: "Daily Studio",
      imageUrl: null,
    },
  ],
}));

/** 최근 추가순(A-4). */
export async function listBrands(): Promise<Brand[]> {
  return brandMockDb.get().brands;
}

export async function createBrand(input: {
  nameKo: string;
  nameEn: string;
  imageFileId: string | null;
}): Promise<Brand> {
  let created: Brand | undefined;
  brandMockDb.update((db) => {
    created = {
      brandIdx: db.nextBrandIdx,
      nameKo: input.nameKo,
      nameEn: input.nameEn,
      imageUrl: input.imageFileId ? getMockFileUrl(input.imageFileId) : null,
    };
    db.nextBrandIdx += 1;
    db.brands.unshift(created);
  });
  if (!created) throw new Error("mock brand was not created");
  return created;
}
