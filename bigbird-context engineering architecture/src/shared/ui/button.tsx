import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { Slot } from "radix-ui"
import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Button(2718:8237)·Icon Button(2718:8839) 기준.
// variant = Figma Type, destructive = Figma Destructive, size: default = Figma md, icon = Figma md 아이콘 버튼.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-secondary text-primary hover:bg-secondary-hover",
        outline: "border bg-background text-primary hover:bg-accent",
        "outline-muted":
          "border bg-background text-muted-foreground hover:bg-accent",
        "outline-foreground":
          "border bg-background text-foreground hover:bg-accent disabled:text-muted-foreground",
        ghost: "text-primary hover:bg-accent",
        "ghost-muted": "text-muted-foreground hover:bg-accent",
        "ghost-foreground":
          "text-foreground hover:bg-accent disabled:text-muted-foreground",
        link: "text-foreground hover:text-primary hover:underline",
        "link-secondary": "text-muted-foreground hover:underline",
      },
      destructive: {
        true: "focus-visible:ring-destructive disabled:opacity-40",
        false: "",
      },
      size: {
        xs: "h-7 min-w-16 gap-1 px-2 text-xs leading-4",
        sm: "h-9 min-w-16 gap-1 px-2 text-sm leading-6",
        default: "h-10 min-w-20 gap-1.5 px-3 text-sm leading-6",
        "icon-xss": "size-5",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        icon: "size-10 rounded-lg",
        "icon-lg": "size-12 rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    compoundVariants: [
      {
        variant: ["link", "link-secondary"],
        className: "h-auto min-w-0 p-0",
      },
      // Figma: ghost·link 계열은 Focused 상태에 링이 없음 (디자인 의도로 확인).
      {
        variant: [
          "ghost",
          "ghost-muted",
          "ghost-foreground",
          "link",
          "link-secondary",
        ],
        className: "focus-visible:ring-0 focus-visible:ring-offset-0",
      },
      {
        variant: "default",
        destructive: true,
        className:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
      },
      {
        variant: "secondary",
        destructive: true,
        className:
          "bg-destructive/10 text-destructive shadow-xs hover:bg-destructive/20 hover:text-destructive-hover",
      },
      {
        variant: ["outline", "outline-muted", "outline-foreground"],
        destructive: true,
        className:
          "border-destructive-subtle text-destructive hover:bg-destructive/10 hover:text-destructive-hover disabled:text-destructive",
      },
      {
        variant: ["ghost", "ghost-muted", "ghost-foreground"],
        destructive: true,
        className:
          "text-destructive hover:bg-destructive/10 hover:text-destructive-hover disabled:text-destructive",
      },
      {
        variant: ["link", "link-secondary"],
        destructive: true,
        className: "text-destructive hover:text-destructive-hover",
      },
    ],
    defaultVariants: {
      variant: "default",
      destructive: false,
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  destructive = false,
  size = "default",
  asChild = false,
  isLoading = false,
  disabled,
  type,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // Figma Loading 상태: 투명도 50%, 아이콘 간격 8px, 앞쪽 스피너.
  // asChild일 때는 자식이 하나여야 해서 스피너를 넣지 않음.

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-destructive={destructive || undefined}
      data-size={size}
      className={cn(
        buttonVariants({ variant, destructive, size, className }),
        isLoading && "gap-2 disabled:opacity-50"
      )}
      // shadcn 원본과 다른 점: <form> 안에서 type을 빠뜨려도 제출되지 않도록 기본값을 button으로 둠.
      // 제출 버튼만 type="submit"을 넘김. asChild(링크 등)는 자식 요소의 속성을 건드리지 않음.
      type={type ?? (asChild ? undefined : "button")}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {asChild ? children : (
        <>
          {isLoading && <LoaderCircle className="animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
