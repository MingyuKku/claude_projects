import i18next from "i18next";

import { DEFAULT_LANGUAGE, type Language } from "./config";
import {
  formatDate,
  formatListDate,
  formatNumber,
  formatNumericDate,
  formatNumericDateTime,
} from "./format";

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

describe("formatNumericDate·formatNumericDateTime", () => {
  const DATE_TIME = new Date(2025, 4, 31, 14, 23, 18);

  afterEach(async () => {
    await i18next.changeLanguage(DEFAULT_LANGUAGE);
  });

  it.each<[Language, string, string]>([
    ["ko", "2025.05.31", "2025-05-31 14:23:18"],
    ["en", "05/31/2025", "05/31/2025 14:23:18"],
    ["ja", "2025/05/31", "2025/05/31 14:23:18"],
    ["zh-CN", "2025/05/31", "2025/05/31 14:23:18"],
  ])(
    "%s 는 언어의 순서·구분자로 공백 없이 포맷한다",
    async (language, expectedDate, expectedDateTime) => {
      await i18next.changeLanguage(language);
      expect(formatNumericDate(DATE_TIME)).toBe(expectedDate);
      expect(formatNumericDateTime(DATE_TIME)).toBe(expectedDateTime);
    },
  );

  it.each<[Language, string]>([
    ["ko", "2025-05-31"],
    ["en", "05/31/2025"],
    ["ja", "2025/05/31"],
    ["zh-CN", "2025/05/31"],
  ])(
    "%s 의 목록 날짜는 일시의 날짜 부분과 같다",
    async (language, expected) => {
      await i18next.changeLanguage(language);
      expect(formatListDate(DATE_TIME)).toBe(expected);
    },
  );

  it("자정은 24시가 아니라 00시로 쓴다", () => {
    expect(formatNumericDateTime(new Date(2025, 4, 31, 0, 5, 9))).toBe(
      "2025-05-31 00:05:09",
    );
  });
});
