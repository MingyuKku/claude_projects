import { describe, expect, it } from "vitest";

import { addHashtag, stripHashtagComma } from "./hashtags";

describe("addHashtag", () => {
  it("항목 안 공백은 두고 앞뒤 공백과 #만 뗀다", () => {
    expect(addHashtag([], " #반려 동물 ")).toEqual(["반려 동물"]);
  });

  it("쉼표는 뺀다", () => {
    expect(addHashtag([], "a,b")).toEqual(["ab"]);
    expect(stripHashtagComma("a，b,c")).toBe("abc");
  });

  it("빈 값과 중복은 더하지 않는다", () => {
    expect(addHashtag(["a"], " , ")).toEqual(["a"]);
    expect(addHashtag(["a"], "a")).toEqual(["a"]);
  });
});
