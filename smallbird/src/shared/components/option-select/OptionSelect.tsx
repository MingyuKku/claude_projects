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
  /** 메뉴의 최대 높이 같은 크기 조정(예: 항목이 많을 때 스크롤하는 높이). */
  contentClassName?: string;
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
  contentClassName,
  ...controlProps
}: OptionSelectProps) {
  return (
    <Select value={value} onValueChange={onChangeValue} disabled={disabled}>
      <SelectTrigger {...controlProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
