import type { CSSProperties } from "react";

/** Inline style that also carries CSS custom properties, without a type assertion. */
export type CssVariableStyle = CSSProperties &
  Record<`--${string}`, string | number>;
