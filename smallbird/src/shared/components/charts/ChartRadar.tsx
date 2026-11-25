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
const DEFAULT_OUTER_RADIUS = 103;
const INNER_RADIUS_RATIO = 0.81;
const GRID_STROKE = "var(--color-slate-300)";
// 시안의 축 이름 위치: 꼭짓점에서 떨어진 거리(px). 위·좌우 위·좌우 아래 순으로 다름.
const LABEL_OFFSETS = {
  top: { x: 0, y: -24 },
  upper: { x: 9, y: -36 },
  lower: { x: 20, y: 20 },
};
// 위쪽 이름까지 영역 안에 들어오는 그래프 가운데 높이.
const CENTER_Y = 137;
// recharts가 축 이름을 바깥 링에서 띄우는 기본 거리.
const TICK_SIZE = 8;

interface AngleTickProps {
  x?: number | string;
  y?: number | string;
  cx?: number | string;
  cy?: number | string;
  radius?: number | string;
  payload?: { value: string };
}

function AngleTick({ payload, ...position }: AngleTickProps) {
  const [x = 0, y = 0, cx = 0, cy = 0, radius = 0] = [
    position.x,
    position.y,
    position.cx,
    position.cy,
    position.radius,
  ].map(Number);
  const ratio = radius / (radius + TICK_SIZE);
  const dx = (x - cx) * ratio;
  const dy = (y - cy) * ratio;
  const isTop = Math.abs(dx) < 1;
  const side = Math.sign(dx);
  const offset = isTop
    ? LABEL_OFFSETS.top
    : LABEL_OFFSETS[dy < 0 ? "upper" : "lower"];

  return (
    <text
      x={cx + dx + (isTop ? 0 : side * offset.x)}
      y={cy + dy + offset.y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-muted-foreground text-xs font-medium"
    >
      {payload?.value}
    </text>
  );
}

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
  /** 바깥 링 반지름(px). 축 이름이 길어 좁은 칸을 넘칠 때 줄임. */
  outerRadius?: number;
  className?: string;
}

export function ChartRadar({
  data,
  max = 100,
  outerRadius = DEFAULT_OUTER_RADIUS,
  className,
}: ChartRadarProps) {
  return (
    <ChartContainer
      config={CHART_CONFIG}
      className={cn(
        "aspect-auto h-62.5 w-69.5 [&_.recharts-surface]:overflow-visible",
        className,
      )}
    >
      <RadarChart data={data} outerRadius={outerRadius} cy={CENTER_Y}>
        <PolarGrid
          gridType="polygon"
          polarRadius={[outerRadius]}
          stroke={GRID_STROKE}
          strokeLinecap="square"
        />
        <PolarGrid
          gridType="polygon"
          polarRadius={[outerRadius * INNER_RADIUS_RATIO]}
          radialLines={false}
          stroke={GRID_STROKE}
          strokeDasharray="6"
        />
        <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
        <PolarAngleAxis dataKey="label" tick={<AngleTick />} tickLine={false} />
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
