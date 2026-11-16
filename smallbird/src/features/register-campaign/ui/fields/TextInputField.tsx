import { FormField } from "@/shared/components/form-field";
import { Input } from "@/shared/ui/input";

import type { ComponentProps } from "react";

interface TextInputFieldProps extends Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange"
> {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  /** 입력값을 거르는 규칙(예: 숫자·하이픈만). */
  normalize?: (value: string) => string;
}

// 라벨(필수 *) + 한 줄 입력.
export function TextInputField({
  label,
  value,
  onChangeValue,
  normalize,
  ...inputProps
}: TextInputFieldProps) {
  return (
    <FormField label={label} isRequired>
      {(control) => (
        <Input
          {...control}
          {...inputProps}
          value={value}
          onChange={(event) =>
            onChangeValue(
              normalize ? normalize(event.target.value) : event.target.value,
            )
          }
        />
      )}
    </FormField>
  );
}
