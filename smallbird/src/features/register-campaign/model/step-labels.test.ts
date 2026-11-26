import { STEP_LABEL_KEYS } from "./step-labels";

describe("STEP_LABEL_KEYS", () => {
  it("2단계는 상품 유형과 관계없이 한 키를 쓴다", () => {
    expect(STEP_LABEL_KEYS.product).toBe("step.product");
  });
});
