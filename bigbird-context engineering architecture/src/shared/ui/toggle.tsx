import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"
import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Toggle(6777:65077): sm 36 / default(md) 40 / lg 44, 아이콘만 있어도 같은 패딩.
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md bg-background text-sm leading-5 font-medium whitespace-nowrap text-foreground transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "",
        outline: "border border-input",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-2.5 py-2",
        lg: "h-11 px-5 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
