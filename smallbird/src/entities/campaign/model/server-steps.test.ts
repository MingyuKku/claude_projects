import { describe, expect, it } from "vitest";

import { toDraftStep } from "./server-steps";

describe("toDraftStep", () => {
  it("서버 단계 이름을 초안 단계로 바꾼다", () => {
    expect(toDraftStep("info")).toBe("info");
    expect(toDraftStep("product")).toBe("product");
    expect(toDraftStep("influencer")).toBe("creator");
    expect(toDraftStep("add-ons")).toBe("addOns");
    expect(toDraftStep("intro")).toBe("intro");
    expect(toDraftStep("conditions")).toBe("conditions");
    expect(toDraftStep("policy")).toBe("policy");
  });

  it("프론트 이름이나 모르는 이름은 null이다", () => {
    expect(toDraftStep("creator")).toBeNull();
    expect(toDraftStep("addOns")).toBeNull();
    expect(toDraftStep("payment")).toBeNull();
    expect(toDraftStep(null)).toBeNull();
  });
});
