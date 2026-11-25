import { SummaryCard } from "@/shared/components/cards";
import { cn } from "@/shared/lib/utils";

import type { ComponentProps } from "react";

const TOGGLE_KEYS = new Set([" ", "Enter"]);
const SELECTED_CLASS_NAME =
  "ring-2 ring-primary ring-offset-2 ring-offset-background";

interface SelectableCardProps extends Omit<
  ComponentProps<typeof SummaryCard>,
  "role" | "onSelect" | "onClick" | "onKeyDown"
> {
  role: "checkbox" | "radio";
  isSelected: boolean;
  onSelect: () => void;
}

// 눌러서 고르는 카드. 고른 카드는 바깥 링이 생기므로 감싸는 스크롤 영역에 링 폭만큼 여백이 있어야 함.
export function SelectableCard({
  isSelected,
  onSelect,
  className,
  ...props
}: SelectableCardProps) {
  return (
    <SummaryCard
      {...props}
      aria-checked={isSelected}
      tabIndex={0}
      className={cn(className, isSelected && SELECTED_CLASS_NAME)}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!TOGGLE_KEYS.has(event.key)) return;
        event.preventDefault();
        onSelect();
      }}
    />
  );
}
