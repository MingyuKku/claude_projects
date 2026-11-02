import { render, screen } from "@testing-library/react";

import { initI18n } from "@/shared/i18n";
import commonEn from "@/shared/i18n/locales/en.json";
import commonJa from "@/shared/i18n/locales/ja.json";
import commonKo from "@/shared/i18n/locales/ko.json";
import commonZhCN from "@/shared/i18n/locales/zh-CN.json";

import en from "../locales/en.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import zhCN from "../locales/zh-CN.json";
import { IntroductionPage } from "./IntroductionPage";

const NAMESPACE = "pages/introduction";

async function useLanguage(language: "ko" | "en" | "ja" | "zh-CN") {
  await initI18n({
    language,
    resources: {
      ko: { common: commonKo, [NAMESPACE]: ko },
      en: { common: commonEn, [NAMESPACE]: en },
      ja: { common: commonJa, [NAMESPACE]: ja },
      "zh-CN": { common: commonZhCN, [NAMESPACE]: zhCN },
    },
  });
}

describe("IntroductionPage 언어", () => {
  it("en 이면 히어로 문구와 페이지 제목을 영어로 만든다", async () => {
    await useLanguage("en");
    render(<IntroductionPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Influencer marketing,start smarter with data",
    );
    expect(document.title).toBe(
      "Bigbird — Influencer marketing, now more accurate with data",
    );
  });

  it("en 이면 푸터 회사 정보도 영어 라벨로 보이고 번호는 그대로다", async () => {
    await useLanguage("en");
    render(<IntroductionPage />);

    expect(
      screen.getByText(/Business Registration No\.: 721-86-03336/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Customer Center: info@biglinkai\.com/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/사업자등록번호/)).not.toBeInTheDocument();
  });

  it("강조 태그가 있는 제목은 태그 문자열 없이 렌더한다", async () => {
    await useLanguage("en");
    const { container } = render(<IntroductionPage />);

    expect(container).not.toHaveTextContent("<accent>");
    expect(
      screen.getByRole("heading", { level: 2, name: /in one place/ }),
    ).toBeInTheDocument();
  });

  it.each(["ja", "zh-CN"] as const)(
    "%s 에서는 단어 단위 줄바꿈(break-keep)이 한국어에만 걸린다",
    async (language) => {
      await useLanguage(language);
      const { container } = render(<IntroductionPage />);

      expect(container.querySelector(".break-keep")).toBeNull();
    },
  );
});
