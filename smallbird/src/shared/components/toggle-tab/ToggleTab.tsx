import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { useActiveTabIndicator } from "@/shared/lib/useActiveTabIndicator";
import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma Toggle / Tab(7185:129153): 회색 트랙 안에서 선택된 항목만 흰 배경으로 떠 보이는 2단 선택.
// Hover는 선택된 항목 위에 accent/50을 겹친 색.
// 선택 표시(흰 알약)는 항목이 아니라 트랙 안의 표시 요소 하나가 그리고, 선택이 바뀌면 새 항목으로 미끄러져 이동함(Tabs와 같은 방식).
export interface ToggleTabOption {
  value: string;
  label: ReactNode;
  /** 라벨 옆 보조 문구(예: 할인율). 선택되면 destructive 색. */
  description?: ReactNode;
}

interface ToggleTabProps {
  options: ToggleTabOption[];
  value: string;
  onValueChange: (value: string) => void;
  "aria-label"?: string;
  className?: string;
}

export function ToggleTab({
  options,
  value,
  onValueChange,
  className,
  ...props
}: ToggleTabProps) {
  const indicatorRef = useActiveTabIndicator<HTMLSpanElement>();

  // Radix RadioGroup 이 방향키 이동과 Tab 한 번 진입(roving tabindex)을 맡음.
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      className={cn(
        "relative inline-flex items-center rounded-md bg-muted p-1",
        className,
      )}
      {...props}
    >
      {/* 위치·크기는 훅이 CSS 변수로 넣어 주고, 처음 위치는 움직이지 않고 놓음. 선택된 항목이 없으면 숨김. */}
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-(--tab-h) w-(--tab-w) translate-x-(--tab-x) translate-y-(--tab-y) rounded-md bg-background opacity-0 shadow-xs data-animate:transition-[translate,width,height,opacity] data-animate:duration-200 data-animate:ease-out data-measured:opacity-100 motion-reduce:transition-none"
      />
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-center whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "text-foreground hover:bg-[color-mix(in_srgb,var(--color-accent)_50%,var(--color-background))]"
                : "text-muted-foreground",
            )}
          >
            <span className="text-sm leading-5 font-medium">
              {option.label}
            </span>
            {option.description && (
              <span
                className={cn(
                  "text-xs leading-4",
                  isSelected && "text-destructive",
                )}
              >
                {option.description}
              </span>
            )}
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
