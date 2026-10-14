import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * Auth-screen input. Not shadcn `Input` for the same reason as AuthButton:
 * height and border colors are member Figma values, not product tokens.
 */

const authInputVariants = cva(
  [
    "bg-light caret-brand h-11 w-full shrink-0 rounded-lg border px-3 text-sm font-normal text-gray-700 outline-none",
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

/** `state` only changes the border color; the caller renders the message. */
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
