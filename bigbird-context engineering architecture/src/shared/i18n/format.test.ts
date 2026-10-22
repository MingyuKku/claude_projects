import i18next from "i18next";

import { DEFAULT_LANGUAGE, type Language } from "./config";
import { formatDate, formatNumber } from "./format";

const DATE = new Date(Date.UTC(2026, 9, 15));

describe("formatDate·formatNumber", () => {
  afterEach(async () => {
    await i18next.changeLanguage(DEFAULT_LANGUAGE);
  });

  it.each<[Language, string]>([
    ["ko", "10월"],
    ["en", "October"],
    ["ja", "10月"],
    ["zh-CN", "十月"],
  ])("%s 에서 월 이름을 현재 언어로 포맷한다", async (language, expected) => {
    await i18next.changeLanguage(language);
    expect(formatDate(DATE, { month: "long", timeZone: "UTC" })).toBe(expected);
  });

  it.each<[Language, string]>([
    ["ko", "1,234,567.5"],
    ["en", "1,234,567.5"],
  ])("%s 에서 숫자를 현재 언어로 포맷한다", async (language, expected) => {
    await i18next.changeLanguage(language);
    expect(formatNumber(1234567.5)).toBe(expected);
  });

  it("통화 단위는 언어가 아니라 옵션으로 정한다", async () => {
    await i18next.changeLanguage("en");
    expect(formatNumber(1000, { style: "currency", currency: "KRW" })).toBe(
      "₩1,000",
    );
  });
});
