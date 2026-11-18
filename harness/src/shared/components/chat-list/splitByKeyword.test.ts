import { describe, expect, it } from "vitest";

import { splitByKeyword } from "./splitByKeyword";

describe("splitByKeyword", () => {
  it("검색어가 없으면 원문 한 조각을 돌려준다", () => {
    expect(splitByKeyword("김하루", "  ")).toEqual([
      { text: "김하루", isMatch: false },
    ]);
  });

  it("대소문자 구분 없이 모든 일치 구간을 나눈다", () => {
    expect(splitByKeyword("Abc abc ABX", "ab")).toEqual([
      { text: "Ab", isMatch: true },
      { text: "c ", isMatch: false },
      { text: "ab", isMatch: true },
      { text: "c ", isMatch: false },
      { text: "AB", isMatch: true },
      { text: "X", isMatch: false },
    ]);
  });

  it("소문자로 바꾸면 글자 수가 달라지는 문자가 앞에 있어도 원문 위치를 강조한다", () => {
    expect(splitByKeyword("İabc", "a")).toEqual([
      { text: "İ", isMatch: false },
      { text: "a", isMatch: true },
      { text: "bc", isMatch: false },
    ]);
  });

  it("정규식 특수문자를 글자 그대로 찾는다", () => {
    expect(splitByKeyword("a.b(c)", "(c)")).toEqual([
      { text: "a.b", isMatch: false },
      { text: "(c)", isMatch: true },
    ]);
  });
});
