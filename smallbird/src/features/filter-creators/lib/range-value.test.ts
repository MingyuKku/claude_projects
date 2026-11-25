import { describe, expect, it } from "vitest";

import { RANGE_FILTER_RULES } from "@/entities/creator";

import {
  isInvalidRange,
  parseRangeText,
  sanitizeRangeText,
  toRangeValue,
} from "./range-value";

describe("sanitizeRangeText", () => {
  it("쉼표와 표시 글자를 버리고 숫자만 남긴다", () => {
    expect(sanitizeRangeText(RANGE_FILTER_RULES.follower, "1,000")).toBe(
      "1000",
    );
    expect(sanitizeRangeText(RANGE_FILTER_RULES.follower, "무제한5")).toBe("5");
  });

  it("정수 항목은 소수점을 받지 않는다", () => {
    expect(sanitizeRangeText(RANGE_FILTER_RULES.follower, "1.5")).toBeNull();
  });

  it("소수 항목은 한 자리까지만 받는다", () => {
    expect(sanitizeRangeText(RANGE_FILTER_RULES.reply, "1.5")).toBe("1.5");
    expect(sanitizeRangeText(RANGE_FILTER_RULES.reply, "1.55")).toBeNull();
  });

  it("상한이 정해진 항목은 100을 넘는 값을 받지 않는다", () => {
    expect(sanitizeRangeText(RANGE_FILTER_RULES.brandIndex, "100")).toBe("100");
    expect(
      sanitizeRangeText(RANGE_FILTER_RULES.brandIndex, "100.1"),
    ).toBeNull();
  });

  it("상한이 없는 항목은 최대 눈금을 넘어도 받는다", () => {
    expect(sanitizeRangeText(RANGE_FILTER_RULES.follower, "20000000")).toBe(
      "20000000",
    );
  });
});

describe("parseRangeText", () => {
  it("비었거나 소수점만 있으면 null", () => {
    expect(parseRangeText("")).toBeNull();
    expect(parseRangeText(".")).toBeNull();
    expect(parseRangeText("5.")).toBe(5);
  });
});

describe("toRangeValue", () => {
  it("최소 0·최대 끝이면 조건 없음", () => {
    expect(toRangeValue(RANGE_FILTER_RULES.follower, 0, null)).toBeUndefined();
    expect(
      toRangeValue(RANGE_FILTER_RULES.follower, 0, 10_000_000),
    ).toBeUndefined();
  });

  it("최대 눈금 이상은 끝 눈금으로 본다", () => {
    expect(toRangeValue(RANGE_FILTER_RULES.follower, 10, 20_000_000)).toEqual({
      min: 10,
      max: null,
    });
    expect(toRangeValue(RANGE_FILTER_RULES.brandIndex, 20, 100)).toEqual({
      min: 20,
      max: null,
    });
  });

  it("최대 눈금 안의 값은 그대로 둔다", () => {
    expect(toRangeValue(RANGE_FILTER_RULES.view, 0, 1000)).toEqual({
      min: 0,
      max: 1000,
    });
  });
});

describe("isInvalidRange", () => {
  it("최소가 최대보다 크면 오류", () => {
    expect(isInvalidRange({ min: 10, max: 5 })).toBe(true);
    expect(isInvalidRange({ min: 10, max: null })).toBe(false);
    expect(isInvalidRange(undefined)).toBe(false);
  });
});
