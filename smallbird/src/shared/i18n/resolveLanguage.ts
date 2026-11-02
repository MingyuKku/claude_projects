import { DEFAULT_LANGUAGE, isLanguage, type Language } from "./config";

// 브라우저 언어는 언어 부분(접두어)으로만 매칭함. zh 는 번체(zh-TW, zh-Hant)도 zh-CN 으로 보냄.
const BROWSER_LANGUAGE_MAP: Record<string, Language> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh-CN",
};

function matchBrowserLanguage(tag: string): Language | undefined {
  const [prefix = ""] = tag.toLowerCase().split(/[-_]/);
  return BROWSER_LANGUAGE_MAP[prefix];
}

// 순서: ?lng= → 저장값 → navigator.languages(앞에서부터) → ko. 지원하지 않는 값은 건너뜀.
export function resolveLanguage({
  query,
  stored,
  browser,
}: {
  query: string | null;
  stored: string | null;
  browser: readonly string[];
}): Language {
  if (isLanguage(query)) return query;
  if (isLanguage(stored)) return stored;
  for (const tag of browser) {
    const language = matchBrowserLanguage(tag);
    if (language) return language;
  }
  return DEFAULT_LANGUAGE;
}
