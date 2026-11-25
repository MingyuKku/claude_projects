import { renderHook } from "@testing-library/react";

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  useTranslation,
} from "@/shared/i18n";

import {
  formatAverageCount,
  formatCompactCount,
  formatIndexScore,
} from "./format-metrics";

// i18next는 shared/i18n 밖에서 직접 임포트할 수 없어 useTranslation의 i18n으로 언어를 바꿈.
function changeLanguage(language: string) {
  const { result } = renderHook(() => useTranslation());
  return result.current.i18n.changeLanguage(language);
}

describe("formatCompactCount", () => {
  afterEach(async () => {
    await changeLanguage(DEFAULT_LANGUAGE);
  });

  it.each<[number, string]>([
    [0, "0"],
    [999, "999"],
    [1_000, "1K"],
    [1_234, "1.2K"],
    [1_299, "1.2K"],
    [125_000, "125K"],
    [999_950, "999.9K"],
    [1_000_000, "1M"],
    [1_250_000, "1.2M"],
    [12_345_678, "12.3M"],
  ])("%i 는 %s 로 줄여 보인다", (value, expected) => {
    expect(formatCompactCount(value)).toBe(expected);
  });

  it.each(SUPPORTED_LANGUAGES)(
    "%s 에서도 같은 단위 문자를 쓴다",
    async (language) => {
      await changeLanguage(language);
      expect(formatCompactCount(1_234)).toBe("1.2K");
      expect(formatCompactCount(2_500_000)).toBe("2.5M");
    },
  );
});

describe("formatIndexScore·formatAverageCount", () => {
  it("값이 없으면 대시, 지수는 소수 첫째 자리로 보인다", () => {
    expect(formatIndexScore(null)).toBe("-");
    expect(formatIndexScore(30)).toBe("30.0");
    expect(formatIndexScore(41.24)).toBe("41.2");
    expect(formatAverageCount(null)).toBe("-");
    expect(formatAverageCount(12345)).toBe("12,345");
    expect(formatAverageCount(12.5)).toBe("12.5");
  });
});
