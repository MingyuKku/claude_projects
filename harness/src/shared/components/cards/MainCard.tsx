import { cva } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

// Figma Card / Main(5058:82913)·Card / Main / Mobile(6881:34632).
// Hover는 흰 바탕 위에 accent/50을 겹친 색. Figma에 Focus 상태가 없어 공통 포커스 링을 씀.
const mainCardVariants = cva(
  "flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 text-left text-card-foreground transition-colors outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_50%,var(--color-background))] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        default: "px-5 pt-4 pb-5",
        mobile: "py-2 pr-2 pl-3",
      },
    },
    defaultVariants: { size: "default" },
  },
);

interface MainCardProps
  extends
    Omit<ComponentProps<"button">, "title">,
    VariantProps<typeof mainCardVariants> {
  title: ReactNode;
  /** Mobile 크기에서는 표시하지 않음(Figma에 없음). */
  description?: ReactNode;
}

export function MainCard({
  title,
  description,
  size,
  className,
  ...props
}: MainCardProps) {
  if (size === "mobile") {
    return (
      <button
        type="button"
        className={cn(mainCardVariants({ size }), className)}
        {...props}
      >
        <span className="flex items-center gap-1">
          <span className="text-sm leading-5 font-semibold">{title}</span>
          <span className="flex rounded-md p-0.5 text-primary">
            <ArrowRight aria-hidden className="size-4" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(mainCardVariants({ size }), className)}
      {...props}
    >
      <span className="flex w-full items-center justify-between">
        <span className="min-w-0 flex-1 text-lg leading-none font-semibold tracking-[-0.45px]">
          {title}
        </span>
        <span className="flex size-8 items-center justify-center rounded-md text-primary">
          <ArrowRight aria-hidden className="size-4" />
        </span>
      </span>
      {description && (
        // Figma 렌더러보다 브라우저의 Pretendard 폭이 약 1px 넓어 태블릿(카드 200px)에서 설명이 3줄로 넘어가므로 자간을 살짝 좁힘.
        <span className="w-full text-sm leading-5 tracking-[-0.01em] text-muted-foreground">
          {description}
        </span>
      )}
    </button>
  );
}
