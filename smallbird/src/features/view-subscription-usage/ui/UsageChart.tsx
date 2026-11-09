import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { formatDate, formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ChartContainer, ChartTooltip } from "@/shared/ui/chart";

import { getYAxisTicks } from "../lib/axis";
import {
  canGoNext,
  canGoPrev,
  getInitialStart,
  getNextStart,
  getPrevStart,
  getVisibleCount,
  hasCarousel,
} from "../lib/chart-window";

import type { UsageLayout } from "../lib/chart-window";
import type {
  UsageGranularity,
  UsageSeriesPoint,
} from "@/entities/subscription";
import type { ChartConfig } from "@/shared/ui/chart";

// 브랜드형 파랑(primary)·공구형 초록(green/500). 색은 하단 카드 제목의 점이 범례를 대신함(시안).
const CHART_CONFIG = {
  brand: { color: "var(--color-primary)" },
  groupBuy: { color: "var(--color-green-500)" },
} satisfies ChartConfig;

// 시안: 막대 묶음 사이 간격은 PC 40·TAB 20·MO 16px이고, 막대 폭은 남는 폭을 나눈 값(PC 월별 24·일별 26, TAB 30, MO 31px).
// Recharts의 barCategoryGap은 묶음 양쪽에 각각 적용되므로 절반을 넘기고, 양 끝에 생기는 여백은 x축 padding으로 상쇄해 시안처럼 가장자리에 붙임. y축 라벨과 차트 사이 간격은 PC 24·TAB 20·MO 16px.
const CATEGORY_GAP = { desktop: 40, tablet: 20, mobile: 16 } as const;
const AXIS_GAP = { desktop: 24, tablet: 20, mobile: 16 } as const;
// 시안(11755:96300): x축 라벨 행은 높이 20px이고 막대 영역과 2px 떨어짐. Recharts가 tickMargin에 3px를 더 얹어 그리므로 라벨(12px)이 행 가운데 오도록 2를 둠.
const X_AXIS_HEIGHT = 22;
const X_AXIS_TICK_MARGIN = 2;
// 툴팁은 마우스를 올린 막대 위(시안: 막대 위 8px, 높이 32px, 폭 60px 이상)에 뜸.
const TOOLTIP_HEIGHT = 32;
const TOOLTIP_MIN_WIDTH = 60;
const TOOLTIP_GAP = 8;

interface UsageChartProps {
  points: UsageSeriesPoint[];
  granularity: UsageGranularity;
  year: number;
  /** 일별일 때만 씀(1~12). */
  month: number;
  layout: UsageLayout;
  /** 처음 보이게 할 위치(이번 달·오늘의 `period`). 없으면 가장 최근 구간. */
  focusPeriod: number | null;
}

// 월별·일별 이용량 막대 차트. 보이는 개수보다 많으면 ←/→로 보이는 개수만큼 넘김(PC 월별은 12개 전체).
// 조건(지표·연·월·단위)이나 화면 크기가 바뀌면 부모가 key로 다시 그려 처음 위치부터 시작함.
export function UsageChart({
  points,
  granularity,
  year,
  month,
  layout,
  focusPeriod,
}: UsageChartProps) {
  const { t } = useTranslation("features/view-subscription-usage");
  const visibleCount = getVisibleCount(granularity, layout);
  const showCarousel = hasCarousel(points.length, visibleCount);
  const focusIndex =
    focusPeriod === null
      ? null
      : points.findIndex((point) => point.period === focusPeriod);
  const [tooltipAnchor, setTooltipAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [start, setStart] = useState(() =>
    getInitialStart(
      points.length,
      visibleCount,
      focusIndex === null || focusIndex < 0 ? null : focusIndex,
    ),
  );

  const visiblePoints = showCarousel
    ? points.slice(start, start + visibleCount)
    : points;
  const data = visiblePoints.map((point) => ({
    ...point,
    label:
      granularity === "monthly"
        ? formatDate(new Date(year, point.period - 1, 1), { month: "short" })
        : formatDate(new Date(year, month - 1, point.period), {
            month: "short",
            day: "numeric",
          }),
  }));
  // y축은 넘기는 동안 흔들리지 않게 전체 데이터의 최댓값으로 정함.
  const maxValue = Math.max(
    0,
    ...points.flatMap((point) => [point.brand, point.groupBuy]),
  );
  const ticks = getYAxisTicks(maxValue);
  const categoryGap = CATEGORY_GAP[layout];

  // 마우스를 올린(MO는 터치한) 막대의 가운데 위로 툴팁을 옮김.
  function anchorTooltip(rect: { x?: number; y?: number; width?: number }) {
    const { x = 0, y = 0, width = 0 } = rect;
    setTooltipAnchor({
      x: x + width / 2 - TOOLTIP_MIN_WIDTH / 2,
      y: y - TOOLTIP_GAP - TOOLTIP_HEIGHT,
    });
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex h-16 items-center justify-between pr-5 pl-6 tablet:pr-4 desktop:pr-6">
        <h3 className="text-base leading-none font-semibold text-foreground">
          {t(granularity === "monthly" ? "chart.monthly" : "chart.daily")}
        </h3>
        {showCarousel && (
          <div className="flex gap-3 tablet:gap-4">
            <Button
              type="button"
              variant="outline-foreground"
              size="icon-sm"
              className="rounded-full disabled:text-foreground"
              aria-label={t("chart.prev")}
              disabled={!canGoPrev(start)}
              onClick={() => setStart(getPrevStart(start, visibleCount))}
            >
              <ArrowLeft />
            </Button>
            <Button
              type="button"
              variant="outline-foreground"
              size="icon-sm"
              className="rounded-full disabled:text-foreground"
              aria-label={t("chart.next")}
              disabled={!canGoNext(start, visibleCount, points.length)}
              onClick={() =>
                setStart(getNextStart(start, visibleCount, points.length))
              }
            >
              <ArrowRight />
            </Button>
          </div>
        )}
      </div>
      <div className="px-6 pt-6 pb-6 tablet:pt-7 desktop:pt-8">
        {/* y축 라벨은 x축 라벨 행까지 포함한 차트 전체 높이에 같은 간격으로 늘어서고, 맨 아래 "0 건"이 x축 라벨과 같은 줄임.
            Recharts의 y축은 값 위치에 눈금을 두고 맨 위 라벨을 영역 안으로 밀어 간격이 달라지므로 라벨은 직접 그림. */}
        <div
          className="flex h-57 tablet:h-56 desktop:h-55"
          style={{ columnGap: AXIS_GAP[layout] }}
        >
          <div
            aria-hidden
            className="flex shrink-0 flex-col items-end justify-between text-xs leading-5 whitespace-nowrap text-muted-foreground"
          >
            {[...ticks].reverse().map((tick) => (
              <span key={tick}>
                {t("count.value", { value: formatNumber(tick) })}
              </span>
            ))}
          </div>
          <ChartContainer
            config={CHART_CONFIG}
            className="aspect-auto h-full min-w-0 flex-1 justify-start [&_.recharts-xAxis-tick-labels_text]:fill-muted-foreground"
          >
            <BarChart
              data={data}
              accessibilityLayer
              barGap={4}
              barCategoryGap={categoryGap / 2}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <YAxis hide domain={[0, ticks[ticks.length - 1] ?? 0]} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                height={X_AXIS_HEIGHT}
                tickMargin={X_AXIS_TICK_MARGIN}
                interval={0}
                padding={{ left: -categoryGap / 2, right: -categoryGap / 2 }}
              />
              {/* 마우스를 올린(MO는 터치한) 막대 하나의 값만 보임. */}
              <ChartTooltip
                cursor={false}
                shared={false}
                position={tooltipAnchor ?? undefined}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const value = payload?.[0]?.value;
                  if (!active || typeof value !== "number") return null;
                  return (
                    <div className="flex h-8 min-w-15 items-center justify-center rounded-md border bg-popover px-3 text-center text-sm leading-5 text-popover-foreground shadow-md">
                      {t("count.tooltip", { value: formatNumber(value) })}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="brand"
                fill="var(--color-brand)"
                radius={4}
                minPointSize={1}
                onMouseEnter={anchorTooltip}
                onClick={anchorTooltip}
              />
              <Bar
                dataKey="groupBuy"
                fill="var(--color-groupBuy)"
                radius={4}
                minPointSize={1}
                onMouseEnter={anchorTooltip}
                onClick={anchorTooltip}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
