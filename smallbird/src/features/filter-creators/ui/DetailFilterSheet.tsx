import { CreatorSheet, useCreatorTerms } from "@/entities/creator";

import { DetailFilterPanel } from "./DetailFilterPanel";

import type { DetailFilterValue } from "../model/detail-filter";

interface DetailFilterSheetProps {
  isOpen: boolean;
  /** 폭. */
  className: string;
  value: DetailFilterValue;
  onApply: (value: DetailFilterValue) => void;
  onClose: () => void;
}

// PC 오른쪽 드로어. 열 때마다 패널을 새로 그려, 적용하지 않고 닫은 값은 남지 않음.
export function DetailFilterSheet({
  isOpen,
  className,
  value,
  onApply,
  onClose,
}: DetailFilterSheetProps) {
  const { term } = useCreatorTerms();

  return (
    <CreatorSheet
      isOpen={isOpen}
      title={term("detailFilter")}
      onClose={onClose}
      className={className}
    >
      <DetailFilterPanel
        value={value}
        isTabletUp
        onApply={onApply}
        onClose={onClose}
      />
    </CreatorSheet>
  );
}
