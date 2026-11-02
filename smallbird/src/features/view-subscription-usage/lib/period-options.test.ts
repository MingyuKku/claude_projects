import { describe, expect, it } from "vitest";

import { clampMonth, getMonthOptions, getYearOptions } from "./period-options";

describe("getYearOptions", () => {
  it("올해부터 2022년까지 내림차순이다", () => {
    expect(getYearOptions(2026)).toEqual([2026, 2025, 2024, 2023, 2022]);
  });
});

describe("getMonthOptions", () => {
  it("올해는 이번 달까지, 지난 해는 12월까지다", () => {
    expect(getMonthOptions(2026, 2026, 10)).toHaveLength(10);
    expect(getMonthOptions(2025, 2026, 10)).toHaveLength(12);
  });
});

describe("clampMonth", () => {
  it("올해로 바꿨을 때 미래 달은 이번 달로 맞춘다", () => {
    expect(clampMonth(12, 2026, 2026, 10)).toBe(10);
    expect(clampMonth(12, 2025, 2026, 10)).toBe(12);
  });
});
