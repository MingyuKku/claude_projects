import { render, screen } from "@testing-library/react";

import { initI18n } from "@/shared/i18n";
import commonEn from "@/shared/i18n/locales/en.json";
import commonKo from "@/shared/i18n/locales/ko.json";

import { TermsDocument } from "./TermsDocument";

async function useLanguage(language: "ko" | "en") {
  await initI18n({
    language,
    resources: { ko: { common: commonKo }, en: { common: commonEn } },
  });
}

describe("TermsDocument", () => {
  it("한국어 약관은 바로 보여 준다", async () => {
    await useLanguage("ko");
    render(<TermsDocument kind="privacy" />);

    expect(screen.getByText("제 1 장 총칙")).toBeInTheDocument();
  });

  it("영어에서는 번역본을 불러온 뒤 보여 준다", async () => {
    await useLanguage("en");
    render(<TermsDocument kind="service" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    // en.ts 이용약관의 실제 첫 문단으로 고정해, 다른 언어·다른 문서가 렌더돼도 실패하게 한다.
    const firstBlock = await screen.findByText(/^Chapter 1 General Provisions/);
    expect(firstBlock).toHaveTextContent("Article 1 (Purpose)");
    expect(screen.queryByText("제 1 장 총칙")).not.toBeInTheDocument();
  });
});
