import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma Toggle / Tab(7185:129153): 회색 트랙 안에서 선택된 항목만 흰 배경으로 떠 보이는 2단 선택.
// Hover는 선택된 항목 위에 accent/50을 겹친 색.
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
  // Radix RadioGroup 이 방향키 이동과 Tab 한 번 진입(roving tabindex)을 맡음.
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      className={cn(
        "inline-flex items-center rounded-md bg-muted p-1",
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-center whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "bg-background text-foreground shadow-xs hover:bg-[color-mix(in_srgb,var(--color-accent)_50%,var(--color-background))]"
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
