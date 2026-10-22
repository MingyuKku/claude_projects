import useSWRImmutable from "swr/immutable";

import { useLanguage } from "@/shared/i18n";

import {
  KO_TERMS,
  pickTerms,
  TERMS_LOADERS,
  type TermsKind,
} from "../model/load-terms-content";

import type { TermsBlock } from "../model/types";

/**
 * 현재 언어의 약관 본문. 한국어는 바로 돌려주고, 다른 언어는 파일을 불러오는 동안
 * `undefined`. 불러오지 못하면 한국어 원문으로 대신함(번역이 없다고 약관을 숨기지 않음).
 */
export function useTermsContent(kind: TermsKind): TermsBlock[] | undefined {
  const language = useLanguage();
  const loader = language === "ko" ? undefined : TERMS_LOADERS[language];

  const { data, error } = useSWRImmutable(
    loader ? ["terms-content", language] : null,
    () => loader?.(),
    { shouldRetryOnError: false },
  );

  if (!loader || error) return pickTerms(KO_TERMS, kind);
  return data ? pickTerms(data, kind) : undefined;
}
