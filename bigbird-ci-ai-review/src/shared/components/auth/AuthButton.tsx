import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * Auth-screen button. shadcn `Button` is not used because its size scale
 * (h-7~h-9) differs from the auth designs, where the button fills whatever
 * height the parent sets (h-12 etc.).
 */

const authButtonVariants = cva(
  [
    "flex h-full w-full cursor-pointer items-center justify-center rounded-lg font-normal transition-all duration-300 outline-none",
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
