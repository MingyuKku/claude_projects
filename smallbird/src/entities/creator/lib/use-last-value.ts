import { useState } from "react";

/** 닫는 즉시 null이 되는 값을 슬라이드아웃이 끝날 때까지 그리려고 마지막 값을 남김. */
export function useLastValue<T>(value: T | null) {
  const [lastValue, setLastValue] = useState(value);
  if (value !== null && value !== lastValue) setLastValue(value);
  return lastValue;
}
