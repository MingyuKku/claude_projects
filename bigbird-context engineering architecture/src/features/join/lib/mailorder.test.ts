import {
  isComposingInput,
  replaceMailorderPart,
  sanitizeMailorderPart,
} from "./mailorder";

describe("replaceMailorderPart", () => {
  it("지정한 칸만 바꾸고 원본은 변경하지 않는다", () => {
    const parts: [string, string, string] = ["2024", "서울", "00001"];
    expect(replaceMailorderPart(parts, 1, "경기")).toEqual([
      "2024",
      "경기",
      "00001",
    ]);
    expect(parts[1]).toBe("서울");
  });
});

describe("sanitizeMailorderPart", () => {
  it("연도는 숫자 4자리까지만 남긴다", () => {
    expect(sanitizeMailorderPart(0, "20a245")).toBe("2024");
  });

  it("지역은 한글만 4글자까지 남긴다", () => {
    expect(sanitizeMailorderPart(1, "서a울1특별시청")).toBe("서울특별");
  });

  it("일련번호는 숫자 5자리까지만 남긴다", () => {
    expect(sanitizeMailorderPart(2, "1234567")).toBe("12345");
  });
});

describe("isComposingInput", () => {
  it("조합 중인 입력 이벤트만 참으로 본다", () => {
    expect(
      isComposingInput(new InputEvent("input", { isComposing: true })),
    ).toBe(true);
    expect(
      isComposingInput(new InputEvent("input", { isComposing: false })),
    ).toBe(false);
    expect(isComposingInput(new Event("input"))).toBe(false);
  });
});
