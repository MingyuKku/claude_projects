import { useTranslation } from "@/shared/i18n";

import { useTermsContent } from "../api/use-terms-content";
import { TermsContent } from "./TermsContent";

import type { TermsKind } from "../model/load-terms-content";

interface TermsDocumentProps {
  kind: TermsKind;
}

/** 현재 언어의 약관 본문을 불러와 보여 줌. 불러오는 동안은 상태 문구만 보임. */
export function TermsDocument({ kind }: TermsDocumentProps) {
  const { t } = useTranslation();
  const content = useTermsContent(kind);

  if (!content) return <p role="status">{t("status.loading")}</p>;
  return <TermsContent content={content} />;
}
