import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

// Figma Dimmed(5084:115872): Light = foreground 10%, Dark = slate-800 80%. PC·TA·MO는 크기만 다르므로 화면 전체를 덮음.
const dimmedVariants = cva("fixed inset-0 z-50", {
  variants: {
    tone: {
      light: "bg-foreground/10",
      dark: "bg-slate-800/80",
    },
  },
  defaultVariants: { tone: "light" },
});

interface DimmedProps
  extends ComponentProps<"div">, VariantProps<typeof dimmedVariants> {}

export function Dimmed({ tone, className, ...props }: DimmedProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(dimmedVariants({ tone }), className)}
      {...props}
    />
  );
}
