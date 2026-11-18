import { useId } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

// Figma Chart Base / Donut(7243:158683): 68px 링, 두께 6px, 채움은 600→500 단계 그라데이션, 나머지는 border 색 트랙.
// recharts PieChart로 그리고 색은 Tailwind 팔레트 CSS 변수를 그대로 넘김.
const RING_SIZE = 68;
const RING_THICKNESS = 6;
const TONE_COLORS = {
  blue: ["var(--color-primary)", "var(--color-blue-500)"],
  green: ["var(--color-green-600)", "var(--color-green-500)"],
  yellow: ["var(--color-yellow-600)", "var(--color-yellow-500)"],
} as const;
const START_ANGLE = 90;

export type ChartDonutTone = "blue" | "green" | "yellow";

export interface ChartDonutItemProps {
  label: string;
  /** 링이 채워지는 비율(0~100) */
  value: number;
  /** 가운데 표시 문구. 없으면 value */
  count?: string;
  badge: string;
  tone?: ChartDonutTone;
  className?: string;
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function ChartDonutItem({
  label,
  value,
  count,
  badge,
  tone = "blue",
  className,
}: ChartDonutItemProps) {
  const percent = clampPercent(value);
  const gradientId = `donut-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [colorFrom, colorTo] = TONE_COLORS[tone];
  return (
    <div
      className={cn(
        "flex w-19.5 flex-col items-center gap-2 px-1.25",
        className,
      )}
    >
      <span className="text-xs leading-5 whitespace-nowrap text-muted-foreground">
        {label}
      </span>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative flex size-17 items-center justify-center"
      >
        <span className="absolute inset-0">
          <PieChart width={RING_SIZE} height={RING_SIZE}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={colorFrom} />
                <stop offset="100%" stopColor={colorTo} />
              </linearGradient>
            </defs>
            <Pie
              data={[{ value: 100 }]}
              dataKey="value"
              innerRadius={RING_SIZE / 2 - RING_THICKNESS}
              outerRadius={RING_SIZE / 2}
              startAngle={START_ANGLE}
              endAngle={START_ANGLE - 360}
              stroke="none"
              fill="var(--color-border)"
              isAnimationActive={false}
            />
            <Pie
              data={[{ value: percent }]}
              dataKey="value"
              innerRadius={RING_SIZE / 2 - RING_THICKNESS}
              outerRadius={RING_SIZE / 2}
              startAngle={START_ANGLE}
              endAngle={START_ANGLE - (360 * percent) / 100}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={`url(#${gradientId})`} />
            </Pie>
          </PieChart>
        </span>
        <span className="relative text-base leading-6 font-semibold text-foreground">
          {count ?? value}
        </span>
      </div>
      <Badge variant={tone} size="sm">
        {badge}
      </Badge>
    </div>
  );
}

export interface ChartDonutDatum extends Omit<
  ChartDonutItemProps,
  "className"
> {
  id: string;
}

interface ChartDonutProps {
  items: ChartDonutDatum[];
  className?: string;
}

// Figma Chart / Donut(7243:159352)
export function ChartDonut({ items, className }: ChartDonutProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    >
      {items.map(({ id, ...item }) => (
        <ChartDonutItem key={id} {...item} />
      ))}
    </div>
  );
}
