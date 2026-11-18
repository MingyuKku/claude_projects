import { useState } from "react";

// 값이 null이 돼도 마지막 값을 돌려줌. 패널 상태가 URL에 있어 닫는 즉시 null이 되는데, 닫힘 애니메이션이 끝나기 전에
// 내용과 크기가 사라지지 않게 하려고 씀.
export function useLastDefined<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}
