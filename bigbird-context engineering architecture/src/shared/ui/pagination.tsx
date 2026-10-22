import { cva } from "class-variance-authority"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

// Figma 디자인 시스템 Pagination(6901:49805).
// 숫자 항목 = Pagination Base / Item(40px, 반경 8), 이전·다음 = Button ghost md.
// <a>는 disabled 속성이 없으므로 aria-disabled로 비활성 상태를 표시함.
const paginationLinkVariants = cva(
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-sm leading-6 font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      isActive: {
        true: "border bg-background",
        false: "",
      },
    },
    defaultVariants: { isActive: false },
  }
)

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"a">

function PaginationLink({ className, isActive, children, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(paginationLinkVariants({ isActive }), className)}
      {...props}
    >
      {children}
    </a>
  )
}

// 이전·다음 문구는 children으로 받음 (화면 문구는 호출하는 쪽에서 결정).
const stepLinkClassName = cn(
  buttonVariants({ variant: "ghost-foreground", size: "default" }),
  "aria-disabled:pointer-events-none aria-disabled:text-muted-foreground aria-disabled:opacity-50"
)

function PaginationPrevious({
  className,
  children,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      aria-label="Go to previous page"
      data-slot="pagination-previous"
      className={cn(stepLinkClassName, className)}
      {...props}
    >
      <ChevronLeftIcon />
      {children}
    </a>
  )
}

function PaginationNext({
  className,
  children,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      aria-label="Go to next page"
      data-slot="pagination-next"
      className={cn(stepLinkClassName, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon />
    </a>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-10 items-center justify-center text-foreground",
        className
      )}
      {...props}
    >
      {/* Figma 예외: ellipsis 아이콘 선 1.5px(전역 1px 규칙과 다름). */}
      <MoreHorizontalIcon strokeWidth={1.5} className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
