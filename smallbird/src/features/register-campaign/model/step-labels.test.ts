import { getStepLabelKey } from "./step-labels";

describe("getStepLabelKey", () => {
  it("공구형 2단계만 '협찬 제품 정보 입력'을 쓴다", () => {
    expect(getStepLabelKey("product", "GROUP_BUY")).toBe(
      "step.productGroupBuy",
    );
    expect(getStepLabelKey("product", "BRAND")).toBe("step.product");
    expect(getStepLabelKey("product", null)).toBe("step.product");
  });

  it("그 밖의 단계는 상품 유형과 관계없이 같다", () => {
    expect(getStepLabelKey("creator", "GROUP_BUY")).toBe("step.creator");
    expect(getStepLabelKey("group-buy", "GROUP_BUY")).toBe("step.groupBuy");
  });
});
