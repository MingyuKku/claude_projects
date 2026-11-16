import { ApiError } from "@/shared/api";
import { getMockFileUrl, mockBrandDb } from "@/shared/lib";

import type { Brand } from "../../model/schema";
import type { MockBrandRecord } from "@/shared/lib";

// 브랜드 목록·추가·삭제(A-6.1~A-6.3)의 목. 저장소는 캠페인 상세 목과 함께 읽어 shared에 있음.

function toBrand({ brandIdx, name, imageUrl }: MockBrandRecord): Brand {
  return { brandIdx, name, imageUrl };
}

/** 지우지 않은 브랜드, 최근 추가순(A-6.1). */
export async function listBrands(): Promise<{ brands: Brand[] }> {
  return {
    brands: mockBrandDb
      .get()
      .brands.filter((brand) => !brand.isDeleted)
      .sort((a, b) => b.brandIdx - a.brandIdx)
      .map(toBrand),
  };
}

export async function createBrand(input: {
  name: string;
  imageAttachmentIdx: number | null;
}): Promise<Brand> {
  const name = input.name.trim();
  if (!name) throw new ApiError(400, { reason: "INVALID_BRAND_NAME" });

  let created: MockBrandRecord | undefined;
  mockBrandDb.update((db) => {
    created = {
      brandIdx: db.nextBrandIdx,
      name,
      imageUrl:
        input.imageAttachmentIdx === null
          ? null
          : getMockFileUrl(input.imageAttachmentIdx),
      isDeleted: false,
    };
    db.nextBrandIdx += 1;
    db.brands.push(created);
  });
  if (!created) throw new Error("mock brand was not created");
  return toBrand(created);
}

/** 삭제 표시만 함(A-6.3). 결제한 캠페인은 지운 브랜드도 그대로 보여 줌. */
export async function deleteBrand(brandIdx: number): Promise<void> {
  const target = mockBrandDb
    .get()
    .brands.find((brand) => brand.brandIdx === brandIdx && !brand.isDeleted);
  if (!target) throw new ApiError(404, { reason: "BRAND_NOT_FOUND" });
  mockBrandDb.update((db) => {
    const brand = db.brands.find((item) => item.brandIdx === brandIdx);
    if (brand) brand.isDeleted = true;
  });
}
