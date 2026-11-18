import { resolveEmptyKind } from "./empty-kind";

describe("resolveEmptyKind", () => {
  it("조건이 없으면 0건이다", () => {
    expect(resolveEmptyKind("", false)).toBe("none");
  });
  it("검색어만, 필터만, 둘 다를 구분한다", () => {
    expect(resolveEmptyKind("여름", false)).toBe("search");
    expect(resolveEmptyKind("", true)).toBe("filter");
    expect(resolveEmptyKind("여름", true)).toBe("searchFilter");
  });
});
