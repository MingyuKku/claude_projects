import { FormField } from "@/shared/components/form-field";
import { Input } from "@/shared/ui/input";

import type { ReactNode } from "react";

interface MediaCountFieldProps {
  label: string;
  unit: ReactNode;
  value: number | null;
  maxDigits: number;
  onChangeValue: (value: number | null) => void;
  disabled?: boolean;
}

// 사진·영상 최소 개수(시안 Photo/Video Count Field): 두 자리 숫자 칸 + "장 이상"·"개 이상".
export function MediaCountField({
  label,
  unit,
  value,
  maxDigits,
  onChangeValue,
  disabled,
}: MediaCountFieldProps) {
  return (
    <FormField label={label} isRequired disabled={disabled} className="w-auto">
      {(control) => (
        <div className="flex items-center gap-2">
          <Input
            {...control}
            inputMode="numeric"
            maxLength={maxDigits}
            placeholder="0"
            className="w-10.5 px-1 text-center"
            value={value ?? ""}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "");
              onChangeValue(digits === "" ? null : Number(digits));
            }}
          />
          <span className="text-sm leading-5 font-medium">{unit}</span>
        </div>
      )}
    </FormField>
  );
}
