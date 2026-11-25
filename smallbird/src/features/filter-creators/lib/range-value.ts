import type { RangeFilterRule, RangeValue } from "@/entities/creator";

const INTEGER_PATTERN = /^\d*$/;
const DECIMAL_PATTERN = /^\d*(\.\d?)?$/;

/**
 * 입력 글자에서 숫자·소수점만 남김(쉼표, `무제한` 같은 표시 글자는 버림).
 * 소수 자리가 규칙보다 많거나 상한이 정해진 항목에서 상한을 넘으면 null(입력 거부).
 */
export function sanitizeRangeText(rule: RangeFilterRule, text: string) {
  const { hasDecimal, isBounded, sliderMax } = rule;
  const digits = text.replace(/[^\d.]/g, "");
  const pattern = hasDecimal ? DECIMAL_PATTERN : INTEGER_PATTERN;
  if (!pattern.test(digits)) return null;
  if (isBounded && Number(digits) > sliderMax) return null;
  return digits;
}

/** 입력 글자를 숫자로. 비었으면 null. */
export function parseRangeText(text: string) {
  return text === "" || text === "." ? null : Number(text);
}

/**
 * 최대 눈금 이상은 끝 눈금(null, 서버도 조건을 걸지 않음)으로 봄.
 * 최소 0·최대 끝이면 조건이 없는 것이라 undefined.
 */
export function toRangeValue(
  rule: RangeFilterRule,
  min: number,
  max: number | null,
): RangeValue | undefined {
  const cappedMax = max !== null && max >= rule.sliderMax ? null : max;
  if (min <= 0 && cappedMax === null) return undefined;
  return { min: Math.max(min, 0), max: cappedMax };
}

export function isInvalidRange(range: RangeValue | undefined) {
  return range !== undefined && range.max !== null && range.min > range.max;
}
