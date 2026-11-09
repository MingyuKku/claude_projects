/** 금액·수량 입력의 자릿수 상한. 안전한 정수 범위를 넘지 않게 함. */
export const MAX_NUMBER_INPUT_DIGITS = 9;

/**
 * 금액·수량 칸의 입력을 숫자로 읽음. 숫자만 남기고(천 단위 구분이나 문자는 버림), 앞의 0은 버리고, 자릿수는 상한까지만 받음.
 * 비었으면 null(입력 없음). 1 이상인지는 단계 검사가 정함.
 */
export function parseNumberInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_NUMBER_INPUT_DIGITS);
  if (digits === "") return null;
  return Number(digits);
}
