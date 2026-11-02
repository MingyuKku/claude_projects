import {
  MAX_CHARGE_AMOUNT,
  MAX_INPUT_DIGITS,
  MIN_CHARGE_AMOUNT,
} from "../model/constants";

export type AmountError = "min" | "max";

const MAX_INPUT_VALUE = 10 ** MAX_INPUT_DIGITS - 1;

/** 입력 문자열에서 숫자만 남겨 금액으로 읽음. 비었거나 0이면 null(입력 없음). 자릿수는 상한까지만 받음. */
export function parseAmount(raw: string): number | null {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_INPUT_DIGITS);
  const amount = Number(digits);
  return amount > 0 ? amount : null;
}

/** 빠른 금액은 입력값에 더함. 한도를 넘어도 그대로 두고 오류로 알리되, 입력 상한은 넘지 않음. */
export function addAmount(current: number | null, added: number): number {
  return Math.min((current ?? 0) + added, MAX_INPUT_VALUE);
}

/** 입력 아래에 보일 오류. 입력이 없으면 오류가 아님. */
export function getAmountError(amount: number | null): AmountError | null {
  if (amount === null) return null;
  if (amount < MIN_CHARGE_AMOUNT) return "min";
  if (amount > MAX_CHARGE_AMOUNT) return "max";
  return null;
}

/** 충전 버튼을 누를 수 있는 금액인지(1원 단위로 최소~한도). */
export function isChargeable(amount: number | null): amount is number {
  return amount !== null && getAmountError(amount) === null;
}
