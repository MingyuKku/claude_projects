"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import * as React from "react"

import { cn } from "@/shared/lib/utils"

function ScrollArea({
  className,
  children,
  scrollBarSize,
  scrollBarStyle,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  scrollBarSize?: VariantProps<typeof scrollBarVariants>["size"]
  /** 세로 스크롤바 위치 조정. 고정 머리글 아래에서 시작할 때 `top`을 줌. */
  scrollBarStyle?: React.CSSProperties
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar size={scrollBarSize} style={scrollBarStyle} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

// Figma Scroll-area Base / Scrollbar(161:1756): md 12px(thumb 8) / sm 10px(thumb 6), 안쪽 여백 2px.
const scrollBarVariants = cva("flex touch-none p-0.5 transition-colors select-none", {
  variants: {
    orientation: {
      vertical: "h-full",
      horizontal: "flex-col",
    },
    size: {
      md: "",
      sm: "",
    },
  },
  compoundVariants: [
    { orientation: "vertical", size: "md", className: "w-3" },
    { orientation: "vertical", size: "sm", className: "w-2.5" },
    { orientation: "horizontal", size: "md", className: "h-3" },
    { orientation: "horizontal", size: "sm", className: "h-2.5" },
  ],
  defaultVariants: { orientation: "vertical", size: "md" },
})

function ScrollBar({
  className,
  orientation = "vertical",
  size = "md",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> &
  Pick<VariantProps<typeof scrollBarVariants>, "size">) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(scrollBarVariants({ orientation, size }), className)}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
