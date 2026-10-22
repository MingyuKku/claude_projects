import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  ChartBubble,
  ChartBubbleItem,
  ChartDonut,
  ChartDonutItem,
  ChartLine,
  ChartRadar,
} from "@/shared/components/charts";
import { KoreaMap } from "@/shared/components/korea-map";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";

import { Section } from "../Section";

import type {
  ChartBubbleDatum,
  ChartDonutDatum,
  ChartRadarDatum,
} from "@/shared/components/charts";
import type { KoreaRegion } from "@/shared/components/korea-map";

const BAR_CONFIG = {
  value: { label: "Revenue", color: "var(--color-primary)" },
} satisfies ChartConfig;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
// Figma Chart Base의 막대 높이(70%, 50%, …)를 $6000 기준으로 옮긴 값
const OVERVIEW_DATA = [70, 50, 20, 40, 100, 50, 40, 60, 20, 20, 70, 30].map(
  (percent, index) => ({ month: MONTHS[index], value: percent * 60 }),
);
const OVERVIEW_TICKS = [0, 1500, 3000, 4500, 6000];
const BAR_STATES = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map(
  (percent) => ({ id: `${percent}`, month: "Jan", value: percent }),
);
const AXIS_TICK = { fontSize: 12 };

const DONUT_BASE: ChartDonutDatum[] = [
  { id: "blue", label: "Title", value: 62, count: "100", badge: "양호" },
  {
    id: "green",
    label: "Title",
    value: 78,
    count: "100",
    badge: "우수",
    tone: "green",
  },
  {
    id: "yellow",
    label: "Title",
    value: 55,
    count: "100",
    badge: "보통",
    tone: "yellow",
  },
];
const DONUT_LIST: ChartDonutDatum[] = [
  { id: "1", label: "영향력 지수", value: 75, badge: "우수", tone: "green" },
  { id: "2", label: "매칭 지수", value: 62, badge: "양호" },
  { id: "3", label: "공구 지수", value: 58, badge: "보통", tone: "yellow" },
  { id: "4", label: "공구 댓글 지수", value: 62, badge: "양호" },
  { id: "5", label: "공구 종합 지수", value: 62, badge: "양호" },
];
const LINE_DATA = [
  { month: "Jan", a: 22, b: 28 },
  { month: "Feb", a: 18, b: 22 },
  { month: "Mar", a: 70, b: 25 },
  { month: "Apr", a: 88, b: 52 },
  { month: "May", a: 92, b: 100 },
];
const LINE_SERIES = [
  { key: "a", label: "Series A" },
  { key: "b", label: "Series B" },
];
const BUBBLE_SIZES: ChartBubbleDatum[] = [
  { id: "canada", label: "Canada", value: "3%", size: "xxs" },
  { id: "spanish", label: "Spanish", value: "9%", size: "xs" },
  { id: "portugal", label: "Portugal", value: "11%", size: "sm" },
  { id: "indonesia", label: "Indonesia", value: "13%", size: "md" },
  { id: "english", label: "English", value: "27%", size: "lg" },
];
const BUBBLE_DATA: ChartBubbleDatum[] = [
  ...BUBBLE_SIZES,
  { id: "korea", label: "Korea", value: "10%", size: "xs" },
  { id: "etc", label: "Etc", value: "5%", size: "xxs" },
  { id: "vlatn", label: "Vlatn", value: "4%", size: "xxs" },
];
const RADAR_DATA: ChartRadarDatum[] = [
  { id: "content", label: "콘텐츠력", value: 70 },
  { id: "favor", label: "팬호감도", value: 92 },
  { id: "spread", label: "확산력", value: 20 },
  { id: "talk", label: "소통지수", value: 80 },
  { id: "growth", label: "성장지수", value: 55 },
];
const MAP_VARIANTS: { region: KoreaRegion; label: string }[] = [
  { region: "seoul", label: "서울시" },
  { region: "daejeon", label: "대전시" },
  { region: "daegu", label: "대구광역시" },
  { region: "busan", label: "부산광역시" },
  { region: "gyeongbuk", label: "경상북도" },
  { region: "gyeongnam", label: "경상남도" },
  { region: "gangwon", label: "강원도" },
  { region: "gyeonggi", label: "경기도" },
  { region: "sejong", label: "세종특별자치시" },
  { region: "ulsan", label: "울산광역시" },
  { region: "incheon", label: "인천광역시" },
  { region: "jeonbuk", label: "전라북도" },
  { region: "jeonnam", label: "전라남도" },
  { region: "jeju", label: "제주도" },
  { region: "chungbuk", label: "충청북도" },
  { region: "chungnam", label: "충청남도" },
  { region: "gwangju", label: "광주광역시" },
];

function OverviewCard() {
  return (
    <div className="flex h-103 w-210 flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <h3 className="p-6 text-base leading-none font-semibold">Overview</h3>
      <ChartContainer
        config={BAR_CONFIG}
        className="aspect-auto min-h-0 flex-1 px-6 pb-6"
      >
        <BarChart
          data={OVERVIEW_DATA}
          barCategoryGap={12}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <YAxis
            ticks={OVERVIEW_TICKS}
            domain={[0, 6000]}
            width={44}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(value: number) => `$${value}`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function BarStates() {
  return (
    <ChartContainer config={BAR_CONFIG} className="aspect-auto h-93.5 w-140">
      <BarChart data={BAR_STATES} barCategoryGap={8}>
        <XAxis
          dataKey="id"
          tickFormatter={() => "Jan"}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

export function ChartSection() {
  return (
    <>
      <Section title="Chart (7085:123896)">
        <div className="flex flex-col gap-10">
          <OverviewCard />
          <BarStates />
        </div>
      </Section>

      <Section title="Chart · New Components (7119:100277)">
        <div className="grid grid-cols-[repeat(3,max-content)] items-start gap-10">
          <div className="flex gap-2">
            {DONUT_BASE.map(({ id, ...item }) => (
              <ChartDonutItem key={id} {...item} />
            ))}
          </div>
          <ChartDonut items={DONUT_LIST} />
          <ChartLine
            data={LINE_DATA}
            xKey="month"
            series={LINE_SERIES}
            yTicks={[10, 50, 100]}
            className="w-109"
          />
          <div className="flex items-center gap-4">
            {BUBBLE_SIZES.map(({ id, ...item }) => (
              <ChartBubbleItem key={id} {...item} />
            ))}
          </div>
          <ChartBubble items={BUBBLE_DATA} />
          <ChartRadar data={RADAR_DATA} />
        </div>
      </Section>

      <Section title="Map (7119:101630)">
        <div className="grid grid-cols-[repeat(4,max-content)] gap-10">
          {MAP_VARIANTS.map(({ region, label }) => (
            <KoreaMap
              key={region}
              label="대한민국 지도"
              selected={region}
              selectedLabel={label}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
