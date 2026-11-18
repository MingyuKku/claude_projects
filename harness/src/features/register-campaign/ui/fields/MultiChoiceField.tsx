import { FormField } from "@/shared/components/form-field";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { ChoiceOption } from "./ChoiceField";

interface MultiChoiceFieldProps<T extends string> {
  label: string;
  value: readonly T[];
  options: readonly ChoiceOption<T>[];
  onChangeValue: (value: T[]) => void;
}

// 여러 개 고르는 테두리 토글. 목록이 길면 줄바꿈함. 항상 하나 이상 선택된 상태라 마지막 하나는 해제할 수 없음.
export function MultiChoiceField<T extends string>({
  label,
  value,
  options,
  onChangeValue,
}: MultiChoiceFieldProps<T>) {
  function handleValueChange(next: string[]) {
    if (next.length === 0) return;
    onChangeValue(
      options.flatMap((option) =>
        next.includes(option.value) ? [option.value] : [],
      ),
    );
  }

  return (
    <FormField label={label} isRequired>
      {({ id }) => (
        <ToggleGroup
          id={id}
          type="multiple"
          variant="outline"
          spacing={2}
          className="flex-wrap"
          aria-label={label}
          value={[...value]}
          onValueChange={handleValueChange}
        >
          {options.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.icon}
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </FormField>
  );
}
