import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

import type { ComponentProps, ReactNode } from "react";

// Figma Button / Group(7021:168638)·Button / Group / Mobile(7149:169922).
// 아이콘 + 제목 + 개수를 담은 선택 버튼. Figma Focus 상태는 포커스 링.
const buttonGroupVariants = cva(
  "flex min-w-20 items-center overflow-hidden rounded-md border bg-background text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "gap-4 px-6 py-4 [&_svg]:size-5",
        mobile: "gap-3 px-4 py-3 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);

const titleVariants = cva(
  "min-w-0 flex-1 truncate leading-none text-foreground",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        mobile: "text-sm font-semibold",
      },
    },
    defaultVariants: { size: "default" },
  },
);

const countVariants = cva(
  "shrink-0 text-sm font-medium text-muted-foreground",
  {
    variants: {
      size: {
        default: "leading-6",
        mobile: "leading-5.5",
      },
    },
    defaultVariants: { size: "default" },
  },
);

interface ButtonGroupProps extends Omit<ComponentProps<"button">, "title"> {
  size?: "default" | "mobile";
  title: string;
  count?: string;
  icon?: ReactNode;
}

export function ButtonGroup({
  size,
  title,
  count,
  icon,
  className,
  type = "button",
  ...props
}: ButtonGroupProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(buttonGroupVariants({ size }), className)}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {icon && <span className="flex shrink-0 text-foreground">{icon}</span>}
        <span className={titleVariants({ size })}>{title}</span>
      </span>
      {count && <span className={countVariants({ size })}>{count}</span>}
    </button>
  );
}
