import { useState } from "react";

import { isPayableProposal } from "@/entities/campaign-progress";

import type { CampaignProposal } from "@/entities/campaign-progress";

export interface ProposalSelection {
  isSelectable: (proposal: CampaignProposal) => boolean;
  isSelected: (proposal: CampaignProposal) => boolean;
  toggle: (proposal: CampaignProposal, isChecked: boolean) => void;
  toggleAll: (isChecked: boolean) => void;
  /** 머리글 체크박스: 다 골랐으면 true, 일부면 "indeterminate". */
  allState: boolean | "indeterminate";
  selectableCount: number;
  selectedIdxList: number[];
}

/**
 * 결제 대기 행만 고를 수 있음(결제 API는 하나라도 결제 대기가 아니면 전체 실패, 스펙 §3).
 * 목록이 바뀌어 결제 대기가 아니게 된 행은 선택에서 빠짐. "전체"는 지금 보이는 쪽 기준.
 */
export function useProposalSelection(
  visible: CampaignProposal[],
  all: CampaignProposal[],
): ProposalSelection {
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const payable = new Set(
    all.filter(isPayableProposal).map((p) => p.proposalIdx),
  );
  const selectedIdxList = [...selected].filter((idx) => payable.has(idx));
  const visibleSelectable = visible.filter(isPayableProposal);
  const visibleSelectedCount = visibleSelectable.filter((p) =>
    selectedIdxList.includes(p.proposalIdx),
  ).length;

  function setOne(idx: number, isChecked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isChecked) next.add(idx);
      else next.delete(idx);
      return next;
    });
  }

  return {
    isSelectable: isPayableProposal,
    isSelected: (proposal) => selectedIdxList.includes(proposal.proposalIdx),
    toggle: (proposal, isChecked) => setOne(proposal.proposalIdx, isChecked),
    toggleAll: (isChecked) =>
      setSelected((prev) => {
        const next = new Set(prev);
        for (const proposal of visibleSelectable) {
          if (isChecked) next.add(proposal.proposalIdx);
          else next.delete(proposal.proposalIdx);
        }
        return next;
      }),
    allState:
      visibleSelectedCount === 0
        ? false
        : visibleSelectedCount === visibleSelectable.length
          ? true
          : "indeterminate",
    selectableCount: visibleSelectable.length,
    selectedIdxList,
  };
}
