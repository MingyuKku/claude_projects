import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * 인증 화면 텍스트 버튼("처음으로", "되돌아가기", "보기" 등).
 * `underlined`는 밑줄과 옅은 글자색, `plain`은 밑줄 없이 본문색.
 */

const authTextButtonVariants = cva(
  "inline-flex cursor-pointer items-center gap-2.5 text-sm leading-normal font-normal outline-none disabled:cursor-default",
  {
    variants: {
      variant: {
        underlined: "border-b border-icon-lined text-icon-lined",
        plain: "text-heading",
      },
    },
    defaultVariants: { variant: "underlined" },
  },
);

interface AuthTextButtonProps
  extends
    ComponentProps<"button">,
    VariantProps<typeof authTextButtonVariants> {}

export function AuthTextButton({
  variant,
  className,
  children,
  ...props
}: AuthTextButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(authTextButtonVariants({ variant }), className)}
    >
      {children}
    </button>
  );
}
