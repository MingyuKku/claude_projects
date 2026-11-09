import { normalizeProduct } from "./normalize-product";
import { createDraftFixture } from "./test-utils";

const address = { zonecode: "06236", address: "서울", detail: "1층" };

function rentalProduct(productPrice: number) {
  return {
    ...createDraftFixture().product,
    productPrice,
    rental: true,
    rentalReturnAddress: address,
    rentalReturnShippingFee: 3000,
    rentalReturnContact: "010-1234-5678",
  };
}

describe("normalizeProduct", () => {
  it("금액이 100만원 미만으로 내려가면 일반 상품으로 되돌리고 대여 입력을 비운다", () => {
    expect(normalizeProduct(rentalProduct(999_999))).toMatchObject({
      rental: false,
      rentalReturnAddress: null,
      rentalReturnShippingFee: null,
      rentalReturnContact: null,
    });
  });

  it("100만원 이상이면 대여 상품과 입력을 그대로 둔다", () => {
    const product = rentalProduct(1_000_000);

    expect(normalizeProduct(product)).toBe(product);
  });

  it("일반 상품이면 금액과 관계없이 그대로 둔다", () => {
    const product = {
      ...createDraftFixture().product,
      productPrice: 100,
      rental: false,
    };

    expect(normalizeProduct(product)).toBe(product);
  });
});
