import { applyProductPatch } from "./apply-product-patch";
import { createDraftFixture } from "./test-utils";

const base = createDraftFixture().product;

describe("applyProductPatch", () => {
  it("고친 칸만 바꾼다", () => {
    expect(applyProductPatch(base, { productName: "세트" })).toEqual({
      ...base,
      productName: "세트",
    });
  });

  it("구매처 링크를 고치면 URL 확인 결과를 지운다", () => {
    const verified = {
      ...base,
      purchaseUrl: "https://a.example",
      purchaseUrlVerified: true,
    };

    expect(
      applyProductPatch(verified, { purchaseUrl: "https://b.example" })
        .purchaseUrlVerified,
    ).toBeNull();
  });

  it("링크와 확인 결과를 함께 넣으면 그 결과를 유지한다", () => {
    const next = applyProductPatch(base, {
      purchaseUrl: "https://a.example",
      purchaseUrlVerified: true,
    });

    expect(next.purchaseUrlVerified).toBe(true);
  });

  it("같은 링크를 다시 넣거나 다른 칸을 고치면 확인 결과를 유지한다", () => {
    const verified = {
      ...base,
      purchaseUrl: "https://a.example",
      purchaseUrlVerified: true,
    };

    expect(
      applyProductPatch(verified, { purchaseUrl: "https://a.example" })
        .purchaseUrlVerified,
    ).toBe(true);
    expect(
      applyProductPatch(verified, { purchaseGuide: "안내" })
        .purchaseUrlVerified,
    ).toBe(true);
  });

  it("금액을 내리면 대여 상품이 일반 상품으로 돌아간다", () => {
    const rental = { ...base, productPrice: 1_000_000, rental: true };

    expect(applyProductPatch(rental, { productPrice: 500_000 }).rental).toBe(
      false,
    );
  });
});
