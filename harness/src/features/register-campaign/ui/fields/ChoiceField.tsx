import { FormField } from "@/shared/components/form-field";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { ReactNode } from "react";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** 이름 앞 아이콘(플랫폼 로고 등). */
  icon?: ReactNode;
  disabled?: boolean;
}

interface ChoiceFieldProps<T extends string> {
  label: string;
  value: T | null;
  options: readonly ChoiceOption<T>[];
  onChangeValue: (value: T) => void;
}

// 하나만 고르는 테두리 토글(Figma Toggle Outlined). 다시 눌러도 해제하지 않음(스펙 §3 선택형 입력).
export function ChoiceField<T extends string>({
  label,
  value,
  options,
  onChangeValue,
}: ChoiceFieldProps<T>) {
  function handleValueChange(next: string) {
    const option = options.find((candidate) => candidate.value === next);
    if (option && option.value !== value) onChangeValue(option.value);
  }

  return (
    <FormField label={label} isRequired>
      {({ id }) => (
        <ToggleGroup
          id={id}
          type="single"
          variant="outline"
          spacing={2}
          className="flex-wrap"
          aria-label={label}
          value={value ?? ""}
          onValueChange={handleValueChange}
        >
          {options.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.icon}
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </FormField>
  );
}
