"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"
import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

// Figma 디자인 시스템 Tabs(2764:25047). Default는 회색 트랙 안 흰 탭, Line은 아래 테두리 + 선택 탭 2px 밑줄.
// 목록에 w-full을 주면 Figma의 Stretch Labels=True처럼 탭이 균등하게 늘어남.
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "rounded-lg bg-secondary p-1",
        line: "items-end border-b border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  onPointerDown,
  onKeyDown,
  onBlur,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  // Radix가 마우스를 누를 때 focus()를 직접 불러서, 포커스된 요소가 없던 상태에서는 브라우저가 이를 키보드 포커스로
  // 보고 :focus-visible이 켜짐(HTML 명세의 포커스 링 휴리스틱). 마우스·터치로 고른 탭에는 링을 숨기고 키보드로
  // 포커스할 때만 보이게 함.
  const [isPointerFocus, setIsPointerFocus] = React.useState(false)

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-pointer-focus={isPointerFocus ? "" : undefined}
      onPointerDown={(event) => {
        setIsPointerFocus(true)
        onPointerDown?.(event)
      }}
      onKeyDown={(event) => {
        setIsPointerFocus(false)
        onKeyDown?.(event)
      }}
      onBlur={(event) => {
        setIsPointerFocus(false)
        onBlur?.(event)
      }}
      className={cn(
        "relative inline-flex min-w-14 flex-1 items-center justify-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground transition-all outline-none group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-pointer-focus:focus-visible:ring-0 data-pointer-focus:focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-3 group-data-[variant=default]/tabs-list:py-1.5 group-data-[variant=default]/tabs-list:leading-5 group-data-[variant=default]/tabs-list:font-medium group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:data-[state=active]:shadow-xs",
        // 밑줄 탭은 목록이 가로 스크롤 래퍼 안에 있는 경우가 많아 바깥 링이 위아래로 잘림. 링을 탭 안쪽에 그림.
        "group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:pt-2 group-data-[variant=line]/tabs-list:pb-3 group-data-[variant=line]/tabs-list:leading-none group-data-[variant=line]/tabs-list:font-semibold group-data-[variant=line]/tabs-list:focus-visible:ring-inset group-data-[variant=line]/tabs-list:focus-visible:ring-offset-0 group-data-[variant=line]/tabs-list:data-[state=active]:border-primary",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
