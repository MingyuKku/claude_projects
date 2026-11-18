import { renderHook } from "@testing-library/react";

import { DEFAULT_LANGUAGE, initI18n, type Language } from "@/shared/i18n";

import { useMoneyFormat } from "./use-money-format";

describe("useMoneyFormat.formatDateTime", () => {
  const DATE = new Date(2026, 9, 23, 14, 23, 18);

  // 일시 포맷은 문구 리소스가 필요 없어 비워 둠.
  const useLanguage = (language: Language) =>
    initI18n({ language, resources: {} });

  afterEach(async () => {
    await useLanguage(DEFAULT_LANGUAGE);
  });

  it.each<[Language, string]>([
    ["ko", "2026-10-23 14:23:18"],
    ["en", "10/23/2026 14:23:18"],
    ["ja", "2026/10/23 14:23:18"],
    ["zh-CN", "2026/10/23 14:23:18"],
  ])("%s 는 24시간제 초 단위 일시로 보인다", async (language, expected) => {
    await useLanguage(language);
    const { result } = renderHook(() => useMoneyFormat());

    expect(result.current.formatDateTime(DATE, "원문")).toBe(expected);
  });

  it("날짜를 읽지 못했으면 원문을 그대로 보인다", () => {
    const { result } = renderHook(() => useMoneyFormat());

    expect(result.current.formatDateTime(null, "2026-13-99")).toBe(
      "2026-13-99",
    );
  });
});
