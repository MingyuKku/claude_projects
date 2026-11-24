import { AuthText } from "./AuthText";

import type { ComponentProps } from "react";

/**
 * 입력창 아래 지원 문구. 상태는 입력창 `state`와 짝을 이룸:
 * default는 안내, pass는 사용 가능 같은 통과, error는 오류.
 */

type AuthSupportTextState = "default" | "pass" | "error";

const TONE_BY_STATE = {
  default: "lined",
  pass: "positive",
  error: "negative",
} as const;

interface AuthSupportTextProps extends Omit<
  ComponentProps<typeof AuthText>,
  "size" | "tone" | "weight"
> {
  state?: AuthSupportTextState;
}

export function AuthSupportText({
  state = "default",
  ...props
}: AuthSupportTextProps) {
  return <AuthText size="sm" tone={TONE_BY_STATE[state]} {...props} />;
}
