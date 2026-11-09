import { resolveRegisterEntry } from "./entry";

describe("resolveRegisterEntry", () => {
  it("등록 중이면 작성 화면이다", () => {
    expect(resolveRegisterEntry("DRAFT", false)).toBe("wizard");
    expect(resolveRegisterEntry("DRAFT", true)).toBe("wizard");
  });

  it("승인 요청 이후 상태는 등록 내역으로 보낸다", () => {
    expect(resolveRegisterEntry("REVIEWING", true)).toBe("detail");
    expect(resolveRegisterEntry("RE_REVIEWING", true)).toBe("detail");
    expect(resolveRegisterEntry("APPROVED", true)).toBe("detail");
    expect(resolveRegisterEntry("REJECTED", false)).toBe("detail");
  });

  it("반려 후 수정(step이 있는 경우)은 작성 화면에서 연다", () => {
    expect(resolveRegisterEntry("REJECTED", true)).toBe("wizard");
  });
});
