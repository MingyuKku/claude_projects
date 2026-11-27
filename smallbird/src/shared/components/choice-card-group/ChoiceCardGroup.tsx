import { RadioGroup } from "radix-ui";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

export interface ChoiceCardOption {
  value: string;
  label: string;
  description: string;
  icon: ReactNode;
  /** 제목 줄 오른쪽 끝에 붙는 뱃지(예: "이용 중"). */
  badge?: ReactNode;
  disabled?: boolean;
}

interface ChoiceCardGroupProps {
  label: string;
  /** 제목(legend)을 화면에서 숨기고 읽기 이름으로만 씀. 화면 제목이 따로 있을 때. */
  isLabelHidden?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: ChoiceCardOption[];
  disabled?: boolean;
  /** 카드 배치(기본: MO 1열, TAB부터 2열). */
  className?: string;
  /** MO에서 여백·줄 높이를 줄인 카드(MO 16, 문의 유형 선택 시안). false면 MO도 TAB·PC와 같은 카드. */
  isCompactOnMobile?: boolean;
}

// Figma Card / Toggle: 선택 링과 키보드 포커스는 카드 전체에 표시함.
// 시안 여백(MO 16, TAB/PC 좌우·아래 20)은 테두리 안쪽까지 재는 값이라 테두리 1px을 뺀 여백을 씀.
export function ChoiceCardGroup({
  label,
  isLabelHidden = false,
  value,
  onValueChange,
  options,
  disabled,
  className,
  isCompactOnMobile = true,
}: ChoiceCardGroupProps) {
  return (
    <fieldset className="min-w-0">
      <legend
        className={cn(
          "mb-3 text-sm leading-none font-semibold desktop:mb-4",
          isLabelHidden && "sr-only",
        )}
      >
        {label}
      </legend>
      <RadioGroup.Root
        aria-label={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className={cn(
          "relative grid grid-cols-1 gap-3 tablet:grid-cols-2",
          className,
        )}
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-lg border border-border bg-card pt-3.75 text-left text-card-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 enabled:hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:ring-offset-2",
              isCompactOnMobile
                ? "px-3.75 pb-3.75 tablet:px-4.75 tablet:pb-4.75"
                : "px-4.75 pb-4.75",
            )}
          >
            <span
              className={cn(
                "flex items-center gap-1.5 text-base font-semibold",
                isCompactOnMobile
                  ? "leading-6.5 tablet:leading-7"
                  : "leading-7",
              )}
            >
              {option.icon}
              <span className="min-w-0 flex-1">{option.label}</span>
              {option.badge}
            </span>
            <span
              className={cn(
                "text-sm",
                isCompactOnMobile ? "leading-4 tablet:leading-5" : "leading-5",
              )}
            >
              {option.description}
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </fieldset>
  );
}
