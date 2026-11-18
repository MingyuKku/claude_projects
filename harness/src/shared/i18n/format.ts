import { getLanguage } from "./language";

import type { Language } from "./config";

export function formatDate(
  value: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(getLanguage(), options).format(value);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getLanguage(), options).format(value);
}

const NUMERIC_DATE = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} as const;
// `hour12: false`는 자정을 24시로 쓰는 환경이 있어 24시간제는 `hourCycle`로 지정함.
const NUMERIC_TIME = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
} as const;

/**
 * 일시에서 날짜 부분의 구분자를 언어 기본값 대신 쓰는 언어. 시안이 한국어 일시를 `2025-05-31 14:23:18`로 그려
 * 한국어 날짜 기본값(`2025.05.31`)과 달라서 둠. 목록에 없는 언어는 `Intl`의 순서·구분자를 따름.
 */
const DATE_TIME_SEPARATOR: Partial<Record<Language, string>> = { ko: "-" };

/**
 * 연·월·일 순서와 구분자는 `Intl`이 언어별로 정하고, 구분자 앞뒤 공백과 끝의 마침표만 뺌
 * (ko `2025.05.31`, en `05/31/2025`, ja·zh-CN `2025/05/31`).
 */
function formatCompactDate(value: Date, separator?: string): string {
  const parts = new Intl.DateTimeFormat(
    getLanguage(),
    NUMERIC_DATE,
  ).formatToParts(value);
  let text = "";
  parts.forEach((part, index) => {
    if (part.type !== "literal") {
      text += part.value;
    } else if (index < parts.length - 1) {
      text += separator ?? part.value.trim();
    }
  });
  return text;
}

/** 공백 없는 숫자 날짜. 멤버십 시작·종료일처럼 날짜만 보여 줄 때 씀. */
export function formatNumericDate(value: Date): string {
  return formatCompactDate(value);
}

/** 목록 표의 날짜만 보이는 칸용. 일시(`formatNumericDateTime`)의 날짜 부분과 같은 구분자라 한 표에서 표기가 어긋나지 않음(ko `2025-05-31`). */
export function formatListDate(value: Date): string {
  return formatCompactDate(value, DATE_TIME_SEPARATOR[getLanguage()]);
}

/** 공백 없는 숫자 날짜 + 24시간제 시각(초 포함). 결제 일시처럼 시각까지 보여 줄 때 씀. */
export function formatNumericDateTime(value: Date): string {
  const date = formatListDate(value);
  const time = new Intl.DateTimeFormat(getLanguage(), NUMERIC_TIME).format(
    value,
  );
  return `${date} ${time}`;
}
