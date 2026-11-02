import type { CSSProperties } from "react";

/** CSS 사용자 지정 속성도 담을 수 있는 인라인 style 타입이며 타입 단언이 필요 없음. */
export type CssVariableStyle = CSSProperties &
  Record<`--${string}`, string | number>;
