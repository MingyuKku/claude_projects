import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * 인증 화면 입력창. AuthButton과 같은 이유로 shadcn `Input`을 쓰지 않음.
 * 높이와 테두리 색이 상품 토큰이 아니라 회원 Figma 값이기 때문.
 */

const authInputVariants = cva(
  [
    "bg-light caret-brand h-11 w-full shrink-0 rounded-auth-lg border px-3 text-sm font-normal text-gray-700 outline-none",
    "placeholder:text-disabled placeholder:font-normal",
    "disabled:bg-hover disabled:border-line1! disabled:cursor-not-allowed disabled:text-gray-500 disabled:placeholder:text-gray-500",
  ],
  {
    variants: {
      state: {
        default: "border-line1",
        success: "border-positive",
        error: "border-negative",
      },
    },
    defaultVariants: { state: "default" },
  },
);

/** `state`는 테두리 색만 바꾸고, 메시지는 호출하는 쪽이 렌더함. */
export interface AuthInputProps
  extends ComponentProps<"input">, VariantProps<typeof authInputVariants> {}

export function AuthInput({ state, className, ...props }: AuthInputProps) {
  return (
    <input
      {...props}
      aria-invalid={state === "error" || undefined}
      className={cn(authInputVariants({ state }), className)}
    />
  );
}
