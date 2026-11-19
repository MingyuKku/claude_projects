import i18next from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  changeLanguage,
  onLanguageChanged,
  registerLanguageLoader,
} from "./changeLanguage";
import { COMMON_NAMESPACE, DEFAULT_LANGUAGE } from "./config";

afterEach(async () => {
  await i18next.changeLanguage(DEFAULT_LANGUAGE);
  i18next.removeResourceBundle("ja", COMMON_NAMESPACE);
});

describe("changeLanguage", () => {
  it("리소스를 불러와 등록하고 언어를 바꾼다", async () => {
    const loader = vi.fn().mockResolvedValue({
      [COMMON_NAMESPACE]: { sample: "サンプル" },
    });
    registerLanguageLoader(loader);

    await changeLanguage("ja");

    expect(loader).toHaveBeenCalledWith("ja");
    expect(i18next.language).toBe("ja");
    expect(i18next.getResource("ja", COMMON_NAMESPACE, "sample")).toBe(
      "サンプル",
    );
  });

  it("이미 불러온 언어는 다시 불러오지 않는다", async () => {
    const loader = vi.fn().mockResolvedValue({
      [COMMON_NAMESPACE]: { sample: "サンプル" },
    });
    registerLanguageLoader(loader);

    await changeLanguage("ja");
    await changeLanguage("ko");
    await changeLanguage("ja");

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("불러오지 못하면 현재 언어를 유지한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    registerLanguageLoader(vi.fn().mockRejectedValue(new Error("network")));

    await changeLanguage("ja");

    expect(i18next.language).toBe(DEFAULT_LANGUAGE);
  });

  it("언어가 바뀌면 구독자에게 알린다", async () => {
    registerLanguageLoader(
      vi.fn().mockResolvedValue({ [COMMON_NAMESPACE]: { sample: "a" } }),
    );
    const listener = vi.fn();
    const unsubscribe = onLanguageChanged(listener);

    await changeLanguage("ja");
    unsubscribe();

    expect(listener).toHaveBeenCalledWith("ja");
  });

  it("로딩 중에 다른 언어를 고르면 마지막에 고른 언어가 된다", async () => {
    let resolveJa: (value: Record<string, unknown>) => void = () => {};
    const loader = vi.fn((language: string) =>
      language === "ja"
        ? new Promise<Record<string, unknown>>((resolve) => {
            resolveJa = resolve;
          })
        : Promise.resolve({ [COMMON_NAMESPACE]: { sample: "a" } }),
    );
    registerLanguageLoader(loader);

    const toJa = changeLanguage("ja");
    await changeLanguage("zh-CN");
    resolveJa({ [COMMON_NAMESPACE]: { sample: "サンプル" } });
    await toJa;

    expect(i18next.language).toBe("zh-CN");
    i18next.removeResourceBundle("zh-CN", COMMON_NAMESPACE);
  });

  it("로딩 중에 원래 언어로 되돌리면 되돌린 언어를 유지한다", async () => {
    let resolveJa: (value: Record<string, unknown>) => void = () => {};
    registerLanguageLoader(
      vi.fn(
        () =>
          new Promise<Record<string, unknown>>((resolve) => {
            resolveJa = resolve;
          }),
      ),
    );

    const toJa = changeLanguage("ja");
    await changeLanguage(DEFAULT_LANGUAGE);
    resolveJa({ [COMMON_NAMESPACE]: { sample: "サンプル" } });
    await toJa;

    expect(i18next.language).toBe(DEFAULT_LANGUAGE);
  });

  it("불러오는 중인 언어를 다시 고르면 로더를 한 번만 부른다", async () => {
    const loader = vi
      .fn()
      .mockResolvedValue({ [COMMON_NAMESPACE]: { sample: "サンプル" } });
    registerLanguageLoader(loader);

    await Promise.all([changeLanguage("ja"), changeLanguage("ja")]);

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
