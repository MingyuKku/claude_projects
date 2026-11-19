import type { Language } from "@/shared/i18n";

// 메뉴 항목의 앞 이름은 각 언어의 자국어 표기라 번역하지 않고, 괄호 안 이름(nameKey)만 현재 언어로 번역함.
export const LANGUAGE_OPTIONS = [
  {
    value: "ko",
    code: "KO",
    nativeName: "한국어",
    nameKey: "language.name.ko",
  },
  {
    value: "en",
    code: "EN",
    nativeName: "English",
    nameKey: "language.name.en",
  },
  {
    value: "ja",
    code: "JA",
    nativeName: "日本語",
    nameKey: "language.name.ja",
  },
  {
    value: "zh-CN",
    code: "ZH",
    nativeName: "简体中文",
    nameKey: "language.name.zhCN",
  },
] as const satisfies readonly {
  value: Language;
  code: string;
  nativeName: string;
  nameKey: string;
}[];
