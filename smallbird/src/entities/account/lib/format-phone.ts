const SEOUL_AREA_CODE = "02";

/**
 * 숫자만 있는 전화번호에 하이픈을 넣음(`01012345678` → `010-1234-5678`).
 * 알 수 없는 길이는 손대지 않고 그대로 돌려줌.
 */
export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits !== value) return value;
  if (digits.startsWith(SEOUL_AREA_CODE)) {
    if (digits.length === 9)
      return digits.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    if (digits.length === 10)
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    return value;
  }
  if (digits.length === 11)
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10)
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  return value;
}
