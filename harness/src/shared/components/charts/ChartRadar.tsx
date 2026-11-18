import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import { cn } from "@/shared/lib/utils";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";

// Figma Chart / Radar(7119:100275): 바깥 링 실선, 안쪽 링(약 80%) 점선 6, 축선 slate-300
const OUTER_RADIUS = 100;
const INNER_RADIUS = 81;
const GRID_STROKE = "var(--color-slate-300)";
const ANGLE_TICK = {
  fontSize: 12,
  fontWeight: 500,
  fill: "var(--color-muted-foreground)",
};
const CHART_CONFIG = {
  value: { color: "var(--color-primary)" },
} satisfies ChartConfig;

export interface ChartRadarDatum {
  id: string;
  label: string;
  value: number;
}

interface ChartRadarProps {
  data: ChartRadarDatum[];
  /** 바깥 링에 해당하는 값 */
  max?: number;
  className?: string;
}

export function ChartRadar({ data, max = 100, className }: ChartRadarProps) {
  return (
    <ChartContainer
      config={CHART_CONFIG}
      className={cn(
        "aspect-auto h-62.5 w-64 [&_.recharts-surface]:overflow-visible",
        className,
      )}
    >
      <RadarChart data={data} outerRadius={OUTER_RADIUS}>
        <PolarGrid
          gridType="polygon"
          polarRadius={[OUTER_RADIUS]}
          stroke={GRID_STROKE}
          strokeLinecap="square"
        />
        <PolarGrid
          gridType="polygon"
          polarRadius={[INNER_RADIUS]}
          radialLines={false}
          stroke={GRID_STROKE}
          strokeDasharray="6"
        />
        <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
        <PolarAngleAxis dataKey="label" tick={ANGLE_TICK} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
        <Radar
          dataKey="value"
          fill="var(--color-blue-100)"
          fillOpacity={1}
          stroke="var(--color-value)"
          strokeWidth={3}
          strokeLinejoin="round"
          className="mix-blend-multiply"
        />
      </RadarChart>
    </ChartContainer>
  );
}
