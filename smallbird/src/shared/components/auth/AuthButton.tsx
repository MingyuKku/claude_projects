import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * 인증 화면 버튼. shadcn `Button`은 크기 단계(h-7~h-9)가 인증 시안과 달라 쓰지 않음.
 * 시안에서는 버튼이 부모가 정한 높이(h-12 등)를 가득 채움.
 */

const authButtonVariants = cva(
  [
    "flex h-full w-full cursor-pointer items-center justify-center rounded-auth-lg font-normal transition-all duration-300 outline-none",
    "disabled:bg-disabled! disabled:text-light! disabled:[&_*]:text-light! disabled:cursor-default",
  ],
  {
    variants: {
      color: {
        primary: "bg-brand text-light",
        light: "border border-gray-300 bg-light text-gray-700",
      },
    },
  },
);

interface AuthButtonProps
  extends
    Omit<ComponentProps<"button">, "color">,
    Required<VariantProps<typeof authButtonVariants>> {}

export function AuthButton({
  color,
  className,
  children,
  ...props
}: AuthButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(authButtonVariants({ color }), className)}
    >
      {children}
    </button>
  );
}
