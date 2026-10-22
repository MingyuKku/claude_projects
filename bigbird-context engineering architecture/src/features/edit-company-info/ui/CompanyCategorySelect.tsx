import { OptionSelect } from "@/shared/components/option-select";

interface CompanyCategorySelectProps {
  /** 선택한 분류 인덱스(문자열). 없으면 빈 문자열. */
  value: string;
  categories: { idx: number; name: string }[];
  /** 저장된 분류 이름. 최상위 목록에 없는 분류(하위 분류 등)여도 선택값으로 보이게 함. */
  savedName: string | null;
  onChangeValue: (value: string) => void;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

// 회사 분류는 최상위 목록만 씀(스펙). 분류 이름은 DB 값이라 번역하지 않고 그대로 보여 줌.
export function CompanyCategorySelect({
  value,
  categories,
  savedName,
  onChangeValue,
  ...controlProps
}: CompanyCategorySelectProps) {
  const options = categories.map((category) => ({
    value: String(category.idx),
    label: category.name,
  }));
  const isSavedMissing =
    value !== "" &&
    savedName !== null &&
    !options.some((option) => option.value === value);
  if (isSavedMissing) options.unshift({ value, label: savedName });

  return (
    <OptionSelect
      {...controlProps}
      value={value}
      options={options}
      onChangeValue={onChangeValue}
    />
  );
}
