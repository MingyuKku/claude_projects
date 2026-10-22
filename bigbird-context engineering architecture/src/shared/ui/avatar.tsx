import { cva, type VariantProps } from "class-variance-authority"
import { Avatar as AvatarPrimitive } from "radix-ui"
import * as React from "react"

import avatarPlaceholder from "@/shared/assets/img/system/avatar-placeholder.svg"
import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Avatar(8:297): xxs 16 ~ 5xl 88, 원형(AvatarImage)·둥근 사각형(AvatarImageRounded).
const avatarVariants = cva(
  "group/avatar relative flex shrink-0 overflow-hidden select-none",
  {
    variants: {
      size: {
        xxs: "size-4",
        xs: "size-6",
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
        xl: "size-14",
        "2xl": "size-16",
        "3xl": "size-18",
        "4xl": "size-20",
        "5xl": "size-22",
      },
      shape: {
        circle: "rounded-full",
        rounded: "",
      },
    },
    compoundVariants: [
      { shape: "rounded", size: "xxs", className: "rounded-sm" },
      { shape: "rounded", size: "xs", className: "rounded-md" },
      { shape: "rounded", size: ["sm", "md"], className: "rounded-lg" },
      { shape: "rounded", size: ["lg", "xl"], className: "rounded-xl" },
      {
        shape: "rounded",
        size: ["2xl", "3xl", "4xl", "5xl"],
        className: "rounded-2xl",
      },
    ],
    defaultVariants: { size: "md", shape: "circle" },
  }
)

function Avatar({
  className,
  size = "md",
  shape = "circle",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(avatarVariants({ size, shape }), className)}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

// 이니셜 대체 표시: 크기별 글자 크기(xxs 8px medium ~ 4xl·5xl 36px)
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-[inherit] bg-muted leading-none text-muted-foreground",
        "group-data-[size=xxs]/avatar:text-[8px] group-data-[size=xxs]/avatar:font-medium group-data-[size=xs]/avatar:text-xs group-data-[size=sm]/avatar:text-sm group-data-[size=md]/avatar:text-base group-data-[size=lg]/avatar:text-lg group-data-[size=xl]/avatar:text-xl group-data-[size=2xl]/avatar:text-2xl group-data-[size=3xl]/avatar:text-3xl group-data-[size=4xl]/avatar:text-4xl group-data-[size=5xl]/avatar:text-4xl",
        className
      )}
      {...props}
    />
  )
}

// 이미지가 없을 때의 기본 이미지: muted 배경 + 테두리 + Figma 사람 아이콘(크기의 절반, shared/assets)
function AvatarPlaceholder({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarFallback
      className={cn("border border-border", className)}
      {...props}
    >
      <img
        src={avatarPlaceholder}
        alt=""
        aria-hidden="true"
        className="size-1/2"
      />
    </AvatarFallback>
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarPlaceholder, AvatarGroup }
