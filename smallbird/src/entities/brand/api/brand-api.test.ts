import { serverApiV3 } from "@/shared/api";

import { addBrand, deleteBrand, fetchBrands } from "./brand-api";

import type * as SharedApi from "@/shared/api";

// 브랜드 API를 서버로 보내는지 검증함.
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => vi.resetAllMocks());

describe("브랜드 API", () => {
  it("목록을 서버에서 읽는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      brands: [{ brandIdx: 4, name: "비글로우", imageUrl: null }],
    });

    const brands = await fetchBrands();

    expect(serverApiV3.get).toHaveBeenCalledWith("/brand");
    expect(brands).toEqual([{ brandIdx: 4, name: "비글로우", imageUrl: null }]);
  });

  it("브랜드 추가는 이름과 이미지 번호를 보내고 새 브랜드를 받는다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      brandIdx: 9,
      name: "새 브랜드",
      imageUrl: "https://example.com/a.png",
    });

    const created = await addBrand({
      name: "새 브랜드",
      imageAttachmentIdx: 3,
    });

    expect(serverApiV3.post).toHaveBeenCalledWith("/brand", {
      name: "새 브랜드",
      imageAttachmentIdx: 3,
    });
    expect(created.brandIdx).toBe(9);
  });

  it("브랜드 삭제는 번호 경로로 보낸다", async () => {
    await deleteBrand(4);

    expect(serverApiV3.delete).toHaveBeenCalledWith("/brand/4");
  });
});
