import { createSpriteStyle } from "./sprite-style";

describe("createSpriteStyle", () => {
  it("PC 는 reverse 카드만 가로 오프셋을 가지고 카드 순서만큼 세로로 내려간다", () => {
    expect(createSpriteStyle(0, { reverse: false })["--s4-pc-pos"]).toBe(
      "0px -0px",
    );
    expect(createSpriteStyle(1, { reverse: true })["--s4-pc-pos"]).toBe(
      "-406px -448px",
    );
  });

  it("MO 는 reverse 여부와 무관하게 가로 오프셋이 없다", () => {
    expect(createSpriteStyle(2, { reverse: true })["--s4-mo-pos"]).toBe(
      "0px -918px",
    );
  });

  it("TAB 은 %로 환산한다", () => {
    const style = createSpriteStyle(0, { reverse: false });

    expect(style["--s4-tab-pos"]).toBe("0% 0%");
    expect(style["--s4-tab-size"]).toMatch(/%.*%/);
  });
});
