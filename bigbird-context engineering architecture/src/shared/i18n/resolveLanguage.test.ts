import { resolveLanguage } from "./resolveLanguage";

describe("resolveLanguage", () => {
  it("지원 언어인 ?lng= 값을 가장 먼저 쓴다", () => {
    expect(
      resolveLanguage({ query: "en", stored: "ja", browser: ["zh-CN"] }),
    ).toBe("en");
  });

  it("지원하지 않는 ?lng= 값은 무시하고 저장값을 쓴다", () => {
    expect(
      resolveLanguage({ query: "xx", stored: "ja", browser: ["en-US"] }),
    ).toBe("ja");
  });

  it("저장값이 없으면 브라우저 언어 중 처음 매칭되는 언어를 쓴다", () => {
    expect(
      resolveLanguage({
        query: null,
        stored: null,
        browser: ["fr-FR", "ja-JP", "en-US"],
      }),
    ).toBe("ja");
  });

  it.each(["zh-TW", "zh-HK", "zh-Hant", "zh"])(
    "중국어(%s)는 번체를 포함해 zh-CN 으로 매칭한다",
    (tag) => {
      expect(
        resolveLanguage({ query: null, stored: null, browser: [tag] }),
      ).toBe("zh-CN");
    },
  );

  it("언어 부분이 다른 태그는 매칭하지 않는다", () => {
    expect(
      resolveLanguage({ query: null, stored: null, browser: ["kok-IN"] }),
    ).toBe("ko");
  });

  it("매칭되는 언어가 없으면 ko 를 쓴다", () => {
    expect(
      resolveLanguage({ query: null, stored: "fr", browser: ["fr-FR"] }),
    ).toBe("ko");
  });
});
