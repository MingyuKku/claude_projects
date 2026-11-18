import { describe, expect, it } from "vitest";

import { getYAxisTicks } from "./axis";

describe("getYAxisTicks", () => {
  it("최댓값을 덮는 같은 간격의 눈금 5개를 만든다", () => {
    expect(getYAxisTicks(189)).toEqual([0, 50, 100, 150, 200]);
    expect(getYAxisTicks(200)).toEqual([0, 50, 100, 150, 200]);
    expect(getYAxisTicks(201)).toEqual([0, 100, 200, 300, 400]);
  });

  it("작은 값이나 0도 정수 눈금이다", () => {
    expect(getYAxisTicks(0)).toEqual([0, 1, 2, 3, 4]);
    expect(getYAxisTicks(6)).toEqual([0, 2, 4, 6, 8]);
  });
});
