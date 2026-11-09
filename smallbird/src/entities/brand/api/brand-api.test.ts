import { registerMockFile } from "@/shared/lib";

import { addBrand, fetchBrands } from "./brand-api";

beforeEach(() => window.sessionStorage.clear());

describe("목 브랜드 API", () => {
  it("등록된 브랜드를 최근 추가순으로 준다", async () => {
    const brands = await fetchBrands();

    expect(brands.length).toBeGreaterThan(0);
    const indexes = brands.map((brand) => brand.brandIdx);
    expect(indexes).toEqual([...indexes].sort((a, b) => b - a));
  });

  it("브랜드를 추가하면 목록 맨 위에 새 번호로 들어간다", async () => {
    const created = await addBrand({
      nameKo: "새 브랜드",
      nameEn: "New Brand",
      imageFileId: null,
    });

    const brands = await fetchBrands();

    expect(brands[0]).toEqual(created);
    expect(
      brands.filter((brand) => brand.brandIdx === created.brandIdx),
    ).toHaveLength(1);
  });

  it("올린 이미지를 붙이면 그 미리보기 주소를 브랜드 이미지로 쓴다", async () => {
    URL.createObjectURL = vi.fn(() => "blob:brand-image");
    const { fileId } = registerMockFile(new Blob(["x"]));

    const created = await addBrand({
      nameKo: "이미지 브랜드",
      nameEn: "Image Brand",
      imageFileId: fileId,
    });

    expect(created.imageUrl).toBe("blob:brand-image");
  });
});
