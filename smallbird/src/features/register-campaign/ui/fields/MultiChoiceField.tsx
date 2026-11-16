import { FormField } from "@/shared/components/form-field";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { ChoiceOption } from "./ChoiceField";

interface MultiChoiceFieldProps<T extends string> {
  label: string;
  value: readonly T[];
  options: readonly ChoiceOption<T>[];
  onChangeValue: (value: T[]) => void;
}

// 여러 개 고르는 테두리 토글(Figma Toggle Outlined, Pressed가 선택). 목록이 길면 줄바꿈함.
export function MultiChoiceField<T extends string>({
  label,
  value,
  options,
  onChangeValue,
}: MultiChoiceFieldProps<T>) {
  function handleValueChange(next: string[]) {
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
