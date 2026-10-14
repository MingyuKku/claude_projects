import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * Auth-screen body text. Uses the member Figma type scale, not the product
 * design system; these screens passed QA as designed, so values stay as is.
 */

const authTextVariants = cva("text-gray-700", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-sm desktop:text-base",
      lg: "text-sm tablet:text-base desktop:text-lg",
      xl: "text-base tablet:text-lg desktop:text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      bold: "font-bold",
    },
  },
  defaultVariants: { size: "md", weight: "normal" },
});

interface AuthTextProps
  extends ComponentProps<"p">, VariantProps<typeof authTextVariants> {
  as?: "p" | "span";
  /** Appends a required-field marker (*). */
  required?: boolean;
}

export function AuthText({
  as: Component = "p",
  size,
  weight,
  className,
  children = null,
  required = false,
  ...props
}: AuthTextProps) {
  return (
    <Component
      className={cn(
        authTextVariants({ size, weight }),
        // leading must come after the size class: tailwind-merge treats
        // text-{size} and leading as conflicting and drops an earlier leading.
        "leading-normal",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="pl-1 text-negative">*</span>}
    </Component>
  );
}
