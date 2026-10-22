export const SUPPORTED_LANGUAGES = ["ko", "en", "ja", "zh-CN"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "ko";

// 여러 슬라이스가 같이 쓰는 문구의 namespace. src/shared/i18n/locales/ 가 원본.
export const COMMON_NAMESPACE = "common";

export function isLanguage(
  value: string | null | undefined,
): value is Language {
  return SUPPORTED_LANGUAGES.some((language) => language === value);
}
