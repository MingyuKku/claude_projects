import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

// Figma 폼 Select(6964:89544): 높이 40의 입력 모양 트리거와 chevron. 폼 행(FormRow)의 컨트롤 props를 그대로 받음.
interface OptionSelectProps {
  value: string;
  options: SelectOption[];
  onChangeValue: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export function OptionSelect({
  value,
  options,
  onChangeValue,
  placeholder,
  disabled,
  ...controlProps
}: OptionSelectProps) {
  return (
    <Select value={value} onValueChange={onChangeValue} disabled={disabled}>
      <SelectTrigger {...controlProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
