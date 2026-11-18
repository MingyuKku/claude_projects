import { isTextEntry } from "./isTextEntry";

describe("isTextEntry", () => {
  it("textarea와 글자 입력 input은 입력 요소다", () => {
    expect(isTextEntry(document.createElement("textarea"))).toBe(true);
    const input = document.createElement("input");
    input.type = "email";
    expect(isTextEntry(input)).toBe(true);
  });

  it("버튼형 input·버튼·null은 입력 요소가 아니다", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    expect(isTextEntry(checkbox)).toBe(false);
    expect(isTextEntry(document.createElement("button"))).toBe(false);
    expect(isTextEntry(null)).toBe(false);
  });
});
