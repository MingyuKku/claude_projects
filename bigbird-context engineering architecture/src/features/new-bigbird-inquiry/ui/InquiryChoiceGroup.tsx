import { RadioGroup } from "radix-ui";

import type { ReactNode } from "react";

interface InquiryChoice {
  value: string;
  label: string;
  description: string;
  icon: ReactNode;
  disabled?: boolean;
}

interface InquiryChoiceGroupProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: InquiryChoice[];
  disabled?: boolean;
}

// Figma Card / Toggle: 선택 링과 키보드 포커스는 카드 전체에 표시함.
// 시안 여백(MO 16, TAB/PC 좌우·아래 20)은 테두리 안쪽까지 재는 값이라 테두리 1px을 뺀 여백을 씀.
export function InquiryChoiceGroup({
  label,
  value,
  onValueChange,
  options,
  disabled,
}: InquiryChoiceGroupProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm leading-none font-semibold desktop:mb-4">
        {label}
      </legend>
      <RadioGroup.Root
        aria-label={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className="relative grid grid-cols-1 gap-3 tablet:grid-cols-2"
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-lg border border-border bg-card px-3.75 pt-3.75 pb-3.75 text-left text-card-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 enabled:hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:ring-offset-2 tablet:px-4.75 tablet:pb-4.75"
          >
            <span className="flex items-center gap-1.5 text-base leading-6.5 font-semibold tablet:leading-7">
              {option.icon}
              {option.label}
            </span>
            <span className="text-sm leading-4 tablet:leading-5">
              {option.description}
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </fieldset>
  );
}
