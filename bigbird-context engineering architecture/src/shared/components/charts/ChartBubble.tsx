import { cva } from "class-variance-authority";

import { packCircles } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

// Figma Chart Base / Bubble(7243:158170): 크기별로 지름·배경·글자 크기가 함께 바뀜.
const bubbleVariants = cva(
  "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-full leading-none whitespace-nowrap",
  {
    variants: {
      size: {
        xxs: "size-9 bg-slate-300 text-foreground",
        xs: "size-12 bg-slate-400 text-background",
        sm: "size-14 bg-sky-300 text-background",
        md: "size-16 bg-sky-400 text-background",
        lg: "size-20 bg-primary text-background shadow-md",
      },
    },
    defaultVariants: { size: "xxs" },
  },
);

const labelVariants = cva("font-medium", {
  variants: {
    size: {
      xxs: "text-[7px]",
      xs: "text-[9px]",
      sm: "text-[9px]",
      md: "text-[10px]",
      lg: "text-xs",
    },
  },
});

const valueVariants = cva("font-bold", {
  variants: {
    size: {
      xxs: "text-[8px]",
      xs: "text-[10px]",
      sm: "text-[11px]",
      md: "text-xs",
      lg: "text-sm",
    },
  },
});

export type ChartBubbleSize = "xxs" | "xs" | "sm" | "md" | "lg";

const BUBBLE_DIAMETER: Record<ChartBubbleSize, number> = {
  xxs: 36,
  xs: 48,
  sm: 56,
  md: 64,
  lg: 80,
};

export interface ChartBubbleItemProps {
  label: string;
  value: string;
  size?: ChartBubbleSize;
  className?: string;
}

export function ChartBubbleItem({
  label,
  value,
  size = "xxs",
  className,
}: ChartBubbleItemProps) {
  return (
    <div className={cn(bubbleVariants({ size }), className)}>
      <span className={labelVariants({ size })}>{label}</span>
      <span className={valueVariants({ size })}>{value}</span>
    </div>
  );
}

export interface ChartBubbleDatum extends Omit<
  ChartBubbleItemProps,
  "className"
> {
  id: string;
}

interface ChartBubbleProps {
  items: ChartBubbleDatum[];
  className?: string;
}

// Figma Chart / Bubble(7243:158321). 시안은 수동 배치라, 큰 원부터 중심에 모아 배치함.
export function ChartBubble({ items, className }: ChartBubbleProps) {
  if (items.length === 0) return null;
  const sorted = [...items].sort(
    (a, b) =>
      BUBBLE_DIAMETER[b.size ?? "xxs"] - BUBBLE_DIAMETER[a.size ?? "xxs"],
  );
  const circles = packCircles(
    sorted.map((item) => BUBBLE_DIAMETER[item.size ?? "xxs"] / 2),
  );
  const minX = Math.min(...circles.map((c) => c.x - c.r));
  const minY = Math.min(...circles.map((c) => c.y - c.r));
  const width = Math.max(...circles.map((c) => c.x + c.r)) - minX;
  const height = Math.max(...circles.map((c) => c.y + c.r)) - minY;
  return (
    <ul className={cn("relative", className)} style={{ width, height }}>
      {sorted.map(({ id, ...item }, index) => {
        const circle = circles[index];
        if (!circle) return null;
        return (
          <li
            key={id}
            className="absolute"
            style={{
              left: circle.x - circle.r - minX,
              top: circle.y - circle.r - minY,
            }}
          >
            <ChartBubbleItem {...item} />
          </li>
        );
      })}
    </ul>
  );
}
