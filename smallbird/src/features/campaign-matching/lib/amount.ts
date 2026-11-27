const AMOUNT_MAX_DIGITS = 9;

/** 입력에서 숫자만 남김. 0·빈 값은 null(서버는 0원 초과만 받음). */
export function parseAmount(text: string) {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "");
  return digits === "" ? null : Number(digits.slice(0, AMOUNT_MAX_DIGITS));
}
