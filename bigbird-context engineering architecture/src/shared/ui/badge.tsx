import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Figma Badge(5198:98237): Type(색) × Size(md/sm)
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        blue: "bg-blue-200 text-blue-600",
        green: "bg-green-200 text-emerald-600",
        gray: "bg-slate-200 text-muted-foreground",
        red: "bg-red-200 text-red-600",
        yellow: "bg-yellow-200 text-yellow-600",
      },
      size: {
        md: "px-2.5 py-2 text-sm leading-none font-semibold",
        sm: "px-1.5 py-0 text-xs leading-5 font-medium",
      },
    },
    defaultVariants: {
      variant: "blue",
      size: "md",
    },
  }
)

function Badge({
  className,
  variant = "blue",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
