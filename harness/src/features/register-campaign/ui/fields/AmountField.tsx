import { PriceField } from "@/shared/components/text-field";
import { formatNumber } from "@/shared/i18n";

/**
 * 입력 최대값. API는 금액·수량을 `integer`로만 적어 폭이 정해지지 않았으므로(A-5.2), 32비트 정수 최대값을 넘지 않게 막음.
 * 이 값보다 크게 치면 최대값으로 맞춤.
 */
const MAX_AMOUNT = 2_147_483_647;
const MAX_DIGITS = String(MAX_AMOUNT).length;

interface AmountFieldProps {
  label?: string;
  isRequired?: boolean;
  unit: string;
  placeholder: string;
  value: number | null;
  onChangeValue: (value: number | null) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

// 금액·수량 칸(Figma Text Field / Count): 숫자만 받고 천 단위로 보이며, 단위("원"·"개")를 오른쪽에 붙임(스펙 §3 2단계).
export function AmountField({
  value,
  onChangeValue,
  ...props
}: AmountFieldProps) {
  return (
    <PriceField
      {...props}
      value={value === null ? "" : formatNumber(value)}
      onChange={(event) => {
        const digits = event.target.value
          .replace(/\D/g, "")
          .slice(0, MAX_DIGITS);
        onChangeValue(digits ? Math.min(Number(digits), MAX_AMOUNT) : null);
      }}
    />
  );
}
