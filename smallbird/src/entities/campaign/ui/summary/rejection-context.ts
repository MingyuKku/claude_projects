import { createContext, use } from "react";

import { CAMPAIGN_SECTIONS } from "../../model/codes";

import type { CampaignSection } from "../../model/codes";

/** 섹션 코드 → 반려 사유. 반려 상태일 때만 채워짐. */
export const SummaryRejectionContext = createContext<
  ReadonlyMap<string, string>
>(new Map());

/** 섹션 번호(1~8)의 반려 사유. 반려되지 않았으면 undefined. */
export function useSummaryRejection(sectionNumber: number) {
  const code = CAMPAIGN_SECTIONS[sectionNumber - 1];
  return code === undefined
    ? undefined
    : use(SummaryRejectionContext).get(code);
}

export interface SummaryEditContextValue {
  /** "수정"을 보일 섹션. 어느 섹션을 고칠 수 있는지는 쓰는 화면이 정함. */
  editableSections: ReadonlySet<CampaignSection>;
  onEdit: (section: CampaignSection) => void;
}

export const SummaryEditContext = createContext<SummaryEditContextValue | null>(
  null,
);

/** 섹션 번호(1~8)의 "수정" 동작. 수정할 수 없는 섹션이면 undefined. */
export function useSummaryEdit(sectionNumber: number) {
  const value = use(SummaryEditContext);
  const code = CAMPAIGN_SECTIONS[sectionNumber - 1];
  if (!value || code === undefined || !value.editableSections.has(code)) {
    return undefined;
  }
  return () => value.onEdit(code);
}
