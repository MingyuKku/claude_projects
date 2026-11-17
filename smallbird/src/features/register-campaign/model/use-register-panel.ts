import { useSearchParams } from "react-router";

import { usePanelParam } from "@/shared/lib";

import type { TermsKind } from "@/entities/terms";

// 하위 화면(`?panel=`). 뒤로가기로 닫히고 새로고침해도 유지됨.
export const REGISTER_PANELS = [
  "brands",
  "add-brand",
  "load-previous",
  "terms",
] as const;
export type RegisterPanel = (typeof REGISTER_PANELS)[number];

const TERMS_KIND_PARAM = "kind";
/** 전문이 있는 약관만 열 수 있음. 캠페인 운영·리워드 정책은 원문을 받을 때까지 없음. */
export const REGISTER_TERMS_KINDS = [
  "service",
  "privacy",
] as const satisfies readonly TermsKind[];
export type RegisterTermsKind = (typeof REGISTER_TERMS_KINDS)[number];

export function useRegisterPanel() {
  const [searchParams] = useSearchParams();
  const { panel, openPanel, closePanel } = usePanelParam({
    panels: REGISTER_PANELS,
    linkedParams: [TERMS_KIND_PARAM],
  });
  const requestedKind = searchParams.get(TERMS_KIND_PARAM);
  const termsKind =
    REGISTER_TERMS_KINDS.find((kind) => kind === requestedKind) ?? null;

  return {
    // 약관 종류가 잘못되면 열지 않음.
    panel: panel === "terms" && termsKind === null ? null : panel,
    termsKind,
    openPanel: (next: Exclude<RegisterPanel, "terms">) => openPanel(next),
    openTerms: (kind: RegisterTermsKind) =>
      openPanel("terms", { [TERMS_KIND_PARAM]: kind }),
    closePanel,
  };
}
