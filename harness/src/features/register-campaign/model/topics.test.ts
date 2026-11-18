import { applyTopicRule } from "./topics";

describe("applyTopicRule", () => {
  it("전체를 새로 고르면 다른 주제를 푼다", () => {
    expect(
      applyTopicRule(["Beauty", "Fashion"], ["Beauty", "Fashion", "All"]),
    ).toEqual(["All"]);
  });

  it("전체가 골라진 상태에서 다른 주제를 고르면 전체를 푼다", () => {
    expect(applyTopicRule(["All"], ["All", "Beauty"])).toEqual(["Beauty"]);
  });

  it("전체가 없으면 고른 그대로다", () => {
    expect(applyTopicRule(["Beauty"], ["Beauty", "Pet"])).toEqual([
      "Beauty",
      "Pet",
    ]);
    expect(applyTopicRule(["Beauty"], [])).toEqual([]);
  });
});
