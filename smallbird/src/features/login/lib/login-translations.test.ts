import { renderHook } from "@testing-library/react";

import { initI18n, useTranslation } from "@/shared/i18n";

import en from "../locales/en.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import zhCN from "../locales/zh-CN.json";

const NAMESPACE = "features/login";

async function translatorFor(language: "ko" | "en" | "ja" | "zh-CN") {
  await initI18n({
    language,
    resources: {
      ko: { [NAMESPACE]: ko },
      en: { [NAMESPACE]: en },
      ja: { [NAMESPACE]: ja },
      "zh-CN": { [NAMESPACE]: zhCN },
    },
  });
  const { result } = renderHook(() => useTranslation(NAMESPACE));
  return result.current.t;
}

describe("features/login 번역", () => {
  it("en 은 잠금 시간의 단수·복수를 구분한다", async () => {
    const t = await translatorFor("en");
    expect(t("error.lockedTemporarily", { count: 1 })).toContain("1 minute.");
    expect(t("error.lockedTemporarily", { count: 5 })).toContain("5 minutes.");
  });

  it.each(["ko", "ja", "zh-CN"] as const)(
    "%s 은 잠금 시간을 한 문구로 만든다",
    async (language) => {
      const t = await translatorFor(language);
      expect(t("error.lockedTemporarily", { count: 1 })).toContain("1");
      expect(t("error.lockedTemporarily", { count: 5 })).toContain("5");
    },
  );

  const DESTROYED_VALUES = {
    userId: "tester",
    year: 2026,
    month: 7,
    day: 1,
    hour: 14,
    minute: 30,
    at: new Date("2026-07-01T14:30:00"),
  };

  it("휴면 안내는 한국어 원문 문구와 날짜 값을 그대로 채운다", async () => {
    const t = await translatorFor("ko");
    const message = t("error.destroyed", DESTROYED_VALUES);
    expect(message).toContain("[tester]");
    expect(message).toContain("2026년 7월 1일 14시 30분");
    expect(message).toContain("정보통신망");
  });

  it.each([
    ["en", "Article 29", "2026"],
    ["ja", "第29条", "2026"],
    ["zh-CN", "第29条", "2026"],
  ] as const)(
    "%s 휴면 안내는 번역되고 아이디·날짜가 들어간다",
    async (language, article, year) => {
      const t = await translatorFor(language);
      const message = t("error.destroyed", DESTROYED_VALUES);
      expect(message).toContain("[tester]");
      expect(message).toContain(article);
      expect(message).toContain(year);
      expect(message).not.toContain("{{");
      expect(message).not.toMatch(/\d+시/);
    },
  );
});
