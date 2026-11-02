import { parseLocalePath } from "./localePath";

describe("parseLocalePath", () => {
  it("shared/i18n/locales 는 common namespace 다", () => {
    expect(parseLocalePath("/src/shared/i18n/locales/ja.json")).toEqual({
      namespace: "common",
      language: "ja",
    });
  });

  it("슬라이스의 locales 는 {layer}/{slice} namespace 다", () => {
    expect(parseLocalePath("/src/pages/not-found/locales/zh-CN.json")).toEqual({
      namespace: "pages/not-found",
      language: "zh-CN",
    });
  });

  it.each([
    "/src/shared/ui/locales/ko.json",
    "/src/pages/login/ui/locales/ko.json",
    "/src/pages/login/locales/fr.json",
  ])("허용하지 않은 위치나 언어(%s)는 무시한다", (path) => {
    expect(parseLocalePath(path)).toBeUndefined();
  });
});
