import koreaMapUrl from "@/shared/assets/img/map/korea.svg";
import { cn } from "@/shared/lib/utils";

// korea.svg의 <g id>와 같은 순서(서울을 경기도 위에 그리도록 마지막에 둠)
export const KOREA_REGIONS = [
  "gyeonggi",
  "incheon",
  "gangwon",
  "chungbuk",
  "jeonbuk",
  "gyeongnam",
  "ulsan",
  "busan",
  "daegu",
  "gyeongbuk",
  "gwangju",
  "jeonnam",
  "jeju",
  "sejong",
  "daejeon",
  "chungnam",
  "seoul",
] as const;

export type KoreaRegion = (typeof KOREA_REGIONS)[number];

const MAP_VIEW_BOX = "0 0 325.415 372.661";
// 지역별 경계 상자(x, y, w, h). 왼쪽 확대 표시에 씀. korea.svg 생성 시 함께 계산한 값.
const REGION_BOX: Record<
  KoreaRegion,
  readonly [number, number, number, number]
> = {
  gyeonggi: [155.1, 24.1, 73.7, 94.6],
  incheon: [145.8, 55.6, 24.7, 30.6],
  gangwon: [186.8, -0.5, 125.5, 110.2],
  chungbuk: [195.3, 95.3, 79.5, 84.0],
  jeonbuk: [148.8, 169.2, 82.3, 60.2],
  gyeongnam: [212.3, 183.9, 93.3, 74.6],
  ulsan: [289.9, 198.9, 30.2, 28.7],
  busan: [280.1, 219.6, 30.6, 27.0],
  daegu: [257.3, 179.3, 22.9, 27.9],
  gyeongbuk: [225.6, 99.8, 100.3, 110.8],
  gwangju: [159.7, 231.9, 22.6, 13.9],
  jeonnam: [127.5, 216.4, 96.9, 81.1],
  jeju: [130.3, 346.9, 45.1, 26.8],
  sejong: [187.4, 129.9, 14.2, 22.0],
  daejeon: [194.0, 147.3, 17.7, 21.0],
  chungnam: [131.9, 108.3, 84.4, 74.6],
  seoul: [170.6, 64.0, 21.5, 19.5],
};
// Figma 확대 도형 너비 60px
const CALLOUT_WIDTH = 60;

const regionHref = (region: KoreaRegion) => `${koreaMapUrl}#${region}`;

interface KoreaMapProps {
  selected?: KoreaRegion;
  /** 선택 지역 이름. 확대 도형 아래에 표시하고 지도 대체 텍스트로도 씀. */
  selectedLabel?: string;
  /** 지도 전체 대체 텍스트 */
  label: string;
  className?: string;
}

// Figma Map(7119:101630): 선택 지역은 blue-100으로 채우고 왼쪽에 확대 도형과 이름을 표시함.
export function KoreaMap({
  selected,
  selectedLabel,
  label,
  className,
}: KoreaMapProps) {
  return (
    <div className={cn("relative w-81.5", className)}>
      <svg
        viewBox={MAP_VIEW_BOX}
        role="img"
        aria-label={selectedLabel ? `${label}: ${selectedLabel}` : label}
        className="block h-auto w-full"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {KOREA_REGIONS.map((region) => (
          <use
            key={region}
            href={regionHref(region)}
            className={cn(
              "fill-background stroke-slate-300",
              region === selected && "fill-blue-100",
            )}
          />
        ))}
      </svg>
      {selected && <RegionCallout region={selected} label={selectedLabel} />}
    </div>
  );
}

function RegionCallout({
  region,
  label,
}: {
  region: KoreaRegion;
  label?: string;
}) {
  const [x, y, width, height] = REGION_BOX[region];
  return (
    <div
      aria-hidden
      className="absolute top-[13.69%] left-0 flex w-[24.58%] flex-col items-center gap-2"
    >
      <svg
        viewBox={`${x} ${y} ${width} ${height}`}
        className="h-auto w-15 overflow-visible"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 확대해도 선 두께가 1px로 보이게 배율만큼 줄임. */}
        <use
          href={regionHref(region)}
          className="fill-blue-100 stroke-slate-300"
          strokeWidth={width / CALLOUT_WIDTH}
        />
      </svg>
      {label && (
        <span className="text-center text-base leading-none font-medium text-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
