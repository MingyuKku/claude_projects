import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { cn } from "@/shared/lib/utils";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";

// Figma Chart / Line(7119:100276) 선 색 순서. 시리즈 색은 순서대로 고정 배정함.
const LINE_COLORS = ["var(--color-primary)", "var(--color-green-500)"];
const AXIS_STROKE = "var(--color-border)";
// recharts는 축 stroke 색을 글자 fill 기본값으로 쓰므로 글자 색을 따로 지정함(Figma: muted-foreground).
const AXIS_TICK = { fontSize: 12, fill: "var(--color-muted-foreground)" };

export interface ChartLineSeries {
  key: string;
  label: string;
  color?: string;
}

interface ChartLineProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartLineSeries[];
  /** Y축 눈금. 첫 값과 끝 값이 축 범위가 됨. */
  yTicks?: number[];
  className?: string;
}

export function ChartLine({
  data,
  xKey,
  series,
  yTicks,
  className,
}: ChartLineProps) {
  const config: ChartConfig = Object.fromEntries(
    series.map((item, index) => [
      item.key,
      { label: item.label, color: item.color ?? LINE_COLORS[index] },
    ]),
  );
  const yDomain = yTicks?.length
    ? [Math.min(...yTicks), Math.max(...yTicks)]
    : undefined;
  return (
    <ChartContainer
      config={config}
      className={cn(
        "aspect-auto h-41.5 w-full [&_.recharts-surface]:overflow-visible",
        className,
      )}
    >
      <LineChart data={data} margin={{ top: 12, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} vertical={false} />
        <XAxis
          dataKey={xKey}
          interval={0}
          tickLine={false}
          stroke={AXIS_STROKE}
          tick={AXIS_TICK}
          tickMargin={8}
        />
        <YAxis
          ticks={yTicks}
          domain={yDomain}
          width={30}
          tickLine={false}
          stroke={AXIS_STROKE}
          tick={AXIS_TICK}
          tickMargin={6}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        {series.map((item) => (
          <Line
            key={item.key}
            dataKey={item.key}
            type="monotone"
            stroke={`var(--color-${item.key})`}
            strokeWidth={1}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
