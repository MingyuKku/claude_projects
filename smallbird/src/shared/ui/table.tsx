"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Data Table(4732:24967) 기준.
// 셀 높이 = Figma Size(xs 48 / sm 56 / md 76 / lg 96), 헤더 톤 = Table Base / Header(기본) · Header Gray.
// 크기·톤은 Table의 data 속성으로 내려 모든 셀이 따름.
// Footer(End. Footer) = muted/50 배경 + font-medium, hover 시 muted.
//
// 가로로 넘치면 첫 열은 고정(sticky)하고 나머지만 스크롤함. 고정 칸은 아래로 지나가는 내용을 가려야 해서 불투명 배경이
// 필요한데, 행 배경(hover·선택)과 머리글 배경이 반투명이라 그대로 쓰면 비침. 그래서 배경을 바탕색과 섞은 불투명 색을
// CSS 변수로 두고, 행은 --table-row-bg를 바꾸며 고정 칸은 같은 변수를 읽어 행과 같은 색이 됨.
const TABLE_COLOR_VARIABLES =
  "[--table-row-hover:color-mix(in_oklab,var(--color-muted)_50%,var(--color-background))] [--table-row-selected:var(--color-muted)] data-[header-tone=gray]:[--table-header-bg:color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]"

// 고정 첫 열. 가로로 스크롤해 뒤 열이 첫 열 밑으로 들어간 동안만 오른쪽에 옅은 그림자를 둬 경계를 보임
// (스크롤하지 않았을 때는 시안 그대로). 칸 자체의 box-shadow는 칸 경계 밖으로 몇 px만 번져 거의 보이지 않아서,
// 칸 오른쪽 바깥에 폭 있는 가상 요소를 두고 그 안을 왼쪽에서 오른쪽으로 옅어지는 안쪽 그림자로 채움(Ant Design 표와 같은 방식).
// 그림자는 늘 그려 두고 불투명도만 바꿔 나타나고 사라질 때 서서히 전환함(그림자 없음↔안쪽 그림자는 부드럽게 이어지지 않음).
const STICKY_FIRST_CELL = [
  "group-data-[first-column-sticky=true]/table:first:sticky group-data-[first-column-sticky=true]/table:first:left-0 group-data-[first-column-sticky=true]/table:first:z-1",
  "group-data-[first-column-sticky=true]/table:first:after:pointer-events-none group-data-[first-column-sticky=true]/table:first:after:absolute group-data-[first-column-sticky=true]/table:first:after:inset-y-0 group-data-[first-column-sticky=true]/table:first:after:right-0 group-data-[first-column-sticky=true]/table:first:after:w-7.5 group-data-[first-column-sticky=true]/table:first:after:translate-x-full group-data-[first-column-sticky=true]/table:first:after:shadow-[inset_10px_0_8px_-8px_rgb(0_0_0/0.15)] group-data-[first-column-sticky=true]/table:first:after:opacity-0 group-data-[first-column-sticky=true]/table:first:after:transition-opacity group-data-[first-column-sticky=true]/table:first:after:duration-300 group-data-[first-column-sticky=true]/table:first:after:ease-out group-data-[first-column-sticky=true]/table:first:after:motion-reduce:transition-none group-data-[first-column-sticky=true]/table:first:after:content-['']",
  "group-data-[first-column-sticky=true]/table:group-data-[scrolled=true]/table:first:after:opacity-100",
].join(" ")

type TableProps = React.ComponentProps<"table"> & {
  size?: "xs" | "sm" | "md" | "lg"
  headerTone?: "default" | "gray"
  /** 가로로 넘칠 때 첫 열을 고정함. 기본 켜짐. */
  isFirstColumnSticky?: boolean
  /** 바깥 컨테이너 클래스. 세로 스크롤 영역 안에서 머리글을 고정할 때 overflow·테두리를 바꿈. */
  containerClassName?: string
}

function Table({
  className,
  size = "sm",
  headerTone = "default",
  isFirstColumnSticky = true,
  containerClassName,
  ...props
}: TableProps) {
  // 첫 열 그림자를 스크롤한 동안만 보이려고 가로 스크롤 위치를 따름. CSS만으로는 스크롤 여부를 고를 방법이
  // 브라우저마다 갖춰지지 않음(scroll-driven animation은 Firefox 미지원).
  const [isScrolled, setIsScrolled] = React.useState(false)

  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto rounded-lg border border-border",
        containerClassName
      )}
      onScroll={(event) => setIsScrolled(event.currentTarget.scrollLeft > 0)}
    >
      <table
        data-slot="table"
        data-size={size}
        data-header-tone={headerTone}
        data-first-column-sticky={isFirstColumnSticky}
        data-scrolled={isScrolled}
        className={cn(
          "group/table w-full caption-bottom text-sm",
          TABLE_COLOR_VARIABLES,
          className
        )}
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
        "bg-(--table-header-bg) [&_tr]:border-b",
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
        // 행 배경을 --table-row-bg로 정해 고정 첫 칸도 같은 색을 씀(본문 행과 같은 방식). muted/50은 바탕색과 섞은 불투명 색.
        "border-t font-medium [--table-row-bg:color-mix(in_oklab,var(--color-muted)_50%,var(--color-background))] [&>tr]:last:border-b-0 [&>tr]:hover:[--table-row-bg:var(--color-muted)]",
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
        // 호버는 본문 행만(머리글 행은 누를 수 없음). 배경은 --table-row-bg로 정해 고정 첫 칸이 같은 색을 씀.
        "border-b bg-(--table-row-bg) transition-colors in-data-[slot=table-body]:hover:[--table-row-bg:var(--table-row-hover)] has-aria-expanded:[--table-row-bg:var(--table-row-hover)] data-[state=selected]:[--table-row-bg:var(--table-row-selected)]",
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
        "px-4 py-3 text-left align-middle text-sm leading-6 font-medium whitespace-nowrap text-muted-foreground has-[[role=checkbox]]:py-4",
        STICKY_FIRST_CELL,
        "group-data-[first-column-sticky=true]/table:first:bg-(--table-header-bg,var(--color-background))",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, colSpan, ...props }: React.ComponentProps<"td">) {
  // 여러 열을 가로지르는 칸(빈 상태 안내 등)은 데이터 첫 열이 아니라 고정하지 않음. 고정하면 오른쪽 바깥에 붙는
  // 그림자 가상 요소가 표 밖으로 삐져나와, 내용이 넘치지 않는데도 가로 스크롤이 생김.
  const isSpanning = colSpan !== undefined && colSpan > 1

  return (
    <td
      data-slot="table-cell"
      colSpan={colSpan}
      className={cn(
        "h-14 px-4 align-middle text-sm leading-5 whitespace-nowrap text-foreground group-data-[size=lg]/table:h-24 group-data-[size=md]/table:h-19 group-data-[size=xs]/table:h-12 in-[tfoot]:font-medium",
        !isSpanning && [
          STICKY_FIRST_CELL,
          // 고정 칸은 행 배경 대신 자기 배경을 칠하므로 행(TableRow)과 같은 전환을 둬 호버 색이 함께 바뀜.
          "group-data-[first-column-sticky=true]/table:first:bg-(--table-row-bg,var(--color-background)) group-data-[first-column-sticky=true]/table:first:transition-colors",
        ],
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
