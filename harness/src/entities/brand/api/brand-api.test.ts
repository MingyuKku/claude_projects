import { isApiError } from "@/shared/api";
import { registerMockFile } from "@/shared/lib";

import { addBrand, deleteBrand, fetchBrands } from "./brand-api";

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
      name: "새 브랜드",
      imageAttachmentIdx: null,
    });

    const brands = await fetchBrands();

    expect(brands[0]).toEqual(created);
    expect(created.imageUrl).toBeNull();
  });

  it("같은 브랜드명도 또 추가할 수 있다", async () => {
    const first = await addBrand({
      name: "같은 이름",
      imageAttachmentIdx: null,
    });
    const second = await addBrand({
      name: "같은 이름",
      imageAttachmentIdx: null,
    });

    expect(second.brandIdx).not.toBe(first.brandIdx);
  });

  it("올린 이미지를 붙이면 그 미리보기 주소를 브랜드 이미지로 쓴다", async () => {
    URL.createObjectURL = vi.fn(() => "blob:brand-image");
    const { attachmentIdx } = registerMockFile(new Blob(["x"]));

    const created = await addBrand({
      name: "이미지 브랜드",
      imageAttachmentIdx: attachmentIdx,
    });

    expect(created.imageUrl).toBe("blob:brand-image");
  });

  it("지운 브랜드는 목록에서 빠지고, 다시 지우면 404다", async () => {
    const [target] = await fetchBrands();
    if (!target) throw new Error("시드 브랜드가 없음");

    await deleteBrand(target.brandIdx);

    const brands = await fetchBrands();
    expect(brands.some((brand) => brand.brandIdx === target.brandIdx)).toBe(
      false,
    );
    const error: unknown = await deleteBrand(target.brandIdx).catch(
      (caught: unknown) => caught,
    );
    expect(isApiError(error) && error.status).toBe(404);
  });
});
