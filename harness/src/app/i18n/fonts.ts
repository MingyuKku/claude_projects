import type { Language } from "@/shared/i18n";

const NOTO_SANS_SC_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap";

// 한국어·영어 사용자가 일본어·중국어 폰트를 내려받지 않도록 해당 언어일 때만 불러옴.
// font-family 는 src/app/styles/index.css 의 :lang() 에서 바꿈.
export function loadLanguageFont(language: Language) {
  if (language === "ja") {
    import("pretendard-jp/dist/web/variable/pretendardvariable-jp-dynamic-subset.css").catch(
      (error: unknown) =>
        console.error("[i18n] 일본어 폰트를 불러오지 못했습니다.", error),
    );
    return;
  }
  if (language === "zh-CN") {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = NOTO_SANS_SC_URL;
    document.head.append(link);
  }
}
