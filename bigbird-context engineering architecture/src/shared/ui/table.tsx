"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Data Table(4732:24967) 기준.
// 셀 높이 = Figma Size(xs 48 / sm 56 / md 76 / lg 96), 헤더 톤 = Table Base / Header(기본) · Header Gray.
// 크기·톤은 Table의 data 속성으로 내려 모든 셀이 따름.
// Footer(End. Footer) = muted/50 배경 + font-medium, hover 시 muted.
type TableProps = React.ComponentProps<"table"> & {
  size?: "xs" | "sm" | "md" | "lg"
  headerTone?: "default" | "gray"
  /** 바깥 컨테이너 클래스. 세로 스크롤 영역 안에서 머리글을 고정할 때 overflow·테두리를 바꿈. */
  containerClassName?: string
}

function Table({
  className,
  size = "sm",
  headerTone = "default",
  containerClassName,
  ...props
}: TableProps) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto rounded-lg border border-border",
        containerClassName
      )}
    >
      <table
        data-slot="table"
        data-size={size}
        data-header-tone={headerTone}
        className={cn("group/table w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b group-data-[header-tone=gray]/table:bg-muted/40",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 [&>tr]:hover:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-4 py-3 text-left align-middle text-sm leading-6 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted/50 group-data-[header-tone=gray]/table:hover:bg-accent has-[[role=checkbox]]:py-4",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-14 px-4 align-middle text-sm leading-5 whitespace-nowrap text-foreground group-data-[size=lg]/table:h-24 group-data-[size=md]/table:h-19 group-data-[size=xs]/table:h-12 [tfoot_&]:font-medium",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
