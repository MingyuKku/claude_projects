"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import * as React from "react"

import {
  SCROLLBAR_THUMB_CLASS_NAME,
  SCROLLBAR_TOUCH_IDLE_CLASS_NAME,
  SCROLLBAR_TRACK_HOVER_CLASS_NAME,
} from "@/shared/lib/scrollbar-style"
import { useScrollbarIdle } from "@/shared/lib/useScrollbarIdle"
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
  const { isIdle, reveal } = useScrollbarIdle()
  // 내용이 늦게 차서 스크롤바가 나중에 생겨도 그때 잠시 보임.
  const handleScrollBarRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (element) reveal()
    },
    [reveal]
  )

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-idle={isIdle}
      className={cn("group/scroll-area relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        onScroll={reveal}
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar
        ref={handleScrollBarRef}
        size={scrollBarSize}
        style={scrollBarStyle}
      />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

// Figma Scroll-area Base / Scrollbar(161:1756): md 12px(thumb 8) / sm 10px(thumb 6), 안쪽 여백 2px.
const scrollBarVariants = cva(
  `group/scrollbar flex touch-none p-0.5 select-none ${SCROLLBAR_TOUCH_IDLE_CLASS_NAME}`,
  {
    variants: {
      orientation: {
        // 높이는 Radix가 주는 top·bottom으로 정해짐(h-full을 주면 top을 내렸을 때 아래로 빠져나감).
        vertical: "",
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
  }
)

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
        className={cn(
          "relative flex-1",
          SCROLLBAR_THUMB_CLASS_NAME,
          SCROLLBAR_TRACK_HOVER_CLASS_NAME
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
