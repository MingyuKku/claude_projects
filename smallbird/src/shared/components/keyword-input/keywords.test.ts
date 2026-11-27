import { describe, expect, it } from "vitest";

import { addKeyword, stripKeywordComma } from "./keywords";

describe("addKeyword", () => {
  it("항목 안 공백은 두고 앞뒤 공백과 #만 뗀다", () => {
    expect(addKeyword([], " #반려 동물 ")).toEqual(["반려 동물"]);
    expect(addKeyword(["협찬"], "  #체험단 ")).toEqual(["협찬", "체험단"]);
  });

  it("쉼표는 뺀다", () => {
    expect(addKeyword([], "a,b")).toEqual(["ab"]);
    expect(stripKeywordComma("a，b,c")).toBe("abc");
  });

  it("빈 값과 중복은 더하지 않는다", () => {
    expect(addKeyword(["a"], " , ")).toEqual(["a"]);
    expect(addKeyword(["a"], "a")).toEqual(["a"]);
    expect(addKeyword(["협찬"], " # ")).toEqual(["협찬"]);
  });
});
