import { digitsOnly } from "@/entities/account";

import {
  MAILORDER_REGION_INDEX,
  MAILORDER_REGION_MAX_LENGTH,
  MAILORDER_SERIAL_DIGITS,
  MAILORDER_SERIAL_INDEX,
  MAILORDER_YEAR_DIGITS,
  MAILORDER_YEAR_INDEX,
  NOT_HANGUL_PATTERN,
} from "../model/constants";

export type MailorderParts = [string, string, string];
export type MailorderIndex =
  | typeof MAILORDER_YEAR_INDEX
  | typeof MAILORDER_REGION_INDEX
  | typeof MAILORDER_SERIAL_INDEX;

const MAILORDER_DIGIT_LIMITS = {
  [MAILORDER_YEAR_INDEX]: MAILORDER_YEAR_DIGITS,
  [MAILORDER_SERIAL_INDEX]: MAILORDER_SERIAL_DIGITS,
} as const;

export function replaceMailorderPart(
  parts: MailorderParts,
  index: MailorderIndex,
  value: string,
): MailorderParts {
  const next: MailorderParts = [...parts];
  next[index] = value;
  return next;
}

/** 지역은 한글만, 연도·일련번호는 자릿수만큼의 숫자만 남김. */
export function sanitizeMailorderPart(index: MailorderIndex, value: string) {
  if (index === MAILORDER_REGION_INDEX) {
    return value
      .replace(NOT_HANGUL_PATTERN, "")
      .slice(0, MAILORDER_REGION_MAX_LENGTH);
  }
  return digitsOnly(value, MAILORDER_DIGIT_LIMITS[index]);
}

/** 조합 중인 입력인지 확인함. React 변경 이벤트의 원본 이벤트를 좁혀 읽음. */
export function isComposingInput(nativeEvent: Event) {
  return nativeEvent instanceof InputEvent && nativeEvent.isComposing;
}
