import { applyAllOptionRule } from "./all-option";

describe("applyAllOptionRule", () => {
  it("무관을 새로 고르면 다른 항목을 푼다", () => {
    expect(
      applyAllOptionRule(
        ["Beauty", "Fashion"],
        ["Beauty", "Fashion", "All"],
        "All",
      ),
    ).toEqual(["All"]);
  });

  it("무관이 골라진 상태에서 다른 항목을 고르면 무관을 푼다", () => {
    expect(applyAllOptionRule(["All"], ["All", "Beauty"], "All")).toEqual([
      "Beauty",
    ]);
  });

  it("무관이 없으면 고른 그대로다", () => {
    expect(
      applyAllOptionRule(["Beauty"], ["Beauty", "Fashion"], "All"),
    ).toEqual(["Beauty", "Fashion"]);
    expect(applyAllOptionRule(["Beauty"], [], "All")).toEqual([]);
  });
});
