import * as koContent from "./content/ko";

import type { TermsBlock } from "./types";
import type { Language } from "@/shared/i18n";

export type TermsKind = "service" | "privacy";

export type TermsDocuments = Record<
  "PRIVACY_POLICY_CONTENT" | "TERMS_OF_SERVICE_CONTENT",
  TermsBlock[]
>;

type TranslatedLanguage = Exclude<Language, "ko">;

// ko 는 번들에 넣고, 다른 언어는 현재 언어의 약관만 불러옴(런타임의 다국어 로딩과 같은 방식).
export const KO_TERMS: TermsDocuments = koContent;

export const TERMS_LOADERS: Record<
  TranslatedLanguage,
  () => Promise<TermsDocuments>
> = {
  en: () => import("./content/en"),
  ja: () => import("./content/ja"),
  "zh-CN": () => import("./content/zh-CN"),
};

export function pickTerms(
  documents: TermsDocuments,
  kind: TermsKind,
): TermsBlock[] {
  return kind === "privacy"
    ? documents.PRIVACY_POLICY_CONTENT
    : documents.TERMS_OF_SERVICE_CONTENT;
}
