import { useState } from "react";

import type { ViewTermsKind } from "./types";

const INITIAL_KIND: ViewTermsKind = "privacy";

/** 닫힘 애니메이션 동안 내용이 바뀌지 않게 열림 여부와 약관 종류를 따로 둠. */
export function useTermsDialog() {
  const [kind, setKind] = useState<ViewTermsKind>(INITIAL_KIND);
  const [isOpen, setIsOpen] = useState(false);

  function openTerms(nextKind: ViewTermsKind) {
    setKind(nextKind);
    setIsOpen(true);
  }

  function closeTerms() {
    setIsOpen(false);
  }

  return { kind, isOpen, openTerms, closeTerms };
}
