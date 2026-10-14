import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * Auth-screen heading using the member Figma type scale (weight 700,
 * line-height 150%, growing mobile -> tablet -> desktop).
 */

type AuthHeadingType =
  | "headline-1"
  | "headline-2"
  | "headline-3"
  | "subtitle-1"
  | "subtitle-2"
  | "subtitle-3";

type AuthHeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";

const authHeadingVariants = cva("font-bold text-gray-700", {
  variants: {
    type: {
      "headline-1":
        "text-[24px] tablet:text-[28px] desktop:text-[30px] tracking-[1px]",
      "headline-2":
        "text-[22px] tablet:text-[24px] desktop:text-[26px] tracking-[1px]",
      "headline-3": "text-[20px] tablet:text-[22px] desktop:text-[24px]",
      "subtitle-1": "text-[18px] tablet:text-[20px] desktop:text-[22px]",
      "subtitle-2": "text-[16px] tablet:text-[18px] desktop:text-[20px]",
      "subtitle-3": "text-[16px] tablet:text-[18px] desktop:text-[18px]",
    },
  },
  defaultVariants: { type: "headline-1" },
});

/** Visual size and document structure are separate; `as` always wins. */
const DEFAULT_TAG: Record<AuthHeadingType, AuthHeadingElement> = {
  "headline-1": "h1",
  "headline-2": "h2",
  "headline-3": "h3",
  "subtitle-1": "h4",
  "subtitle-2": "h5",
  "subtitle-3": "h6",
};

interface AuthHeadingProps
  extends
    Omit<ComponentProps<"h1">, "type">,
    VariantProps<typeof authHeadingVariants> {
  as?: AuthHeadingElement;
}

export function AuthHeading({
  type = "headline-1",
  as,
  className,
  children = null,
  ...props
}: AuthHeadingProps) {
  const Component = as ?? DEFAULT_TAG[type ?? "headline-1"];

  return (
    <Component
      className={cn(
        authHeadingVariants({ type }),
        // leading must come after the size class, same reason as AuthText.
        "leading-[1.5]",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
