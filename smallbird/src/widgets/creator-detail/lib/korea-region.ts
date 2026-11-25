import type { KoreaRegion } from "@/shared/components/korea-map";

/** 서버가 주는 시·도 이름 → 지도 지역. */
const REGION_BY_NAME: Record<string, KoreaRegion> = {
  서울특별시: "seoul",
  경기도: "gyeonggi",
  강원도: "gangwon",
  충청북도: "chungbuk",
  충청남도: "chungnam",
  전라북도: "jeonbuk",
  전라남도: "jeonnam",
  경상북도: "gyeongbuk",
  경상남도: "gyeongnam",
  제주특별자치도: "jeju",
  부산광역시: "busan",
  대구광역시: "daegu",
  울산광역시: "ulsan",
  인천광역시: "incheon",
  대전광역시: "daejeon",
  광주광역시: "gwangju",
  세종특별자치시: "sejong",
};

/** 시안 지도가 서버 이름보다 줄여 적는 지역. */
const MAP_LABEL_BY_NAME: Record<string, string> = {
  서울특별시: "서울시",
  대전광역시: "대전시",
  제주특별자치도: "제주도",
};

interface IntroArea {
  area: string | null;
  parentArea: string | null;
}

/** 시·도까지만 고른 크리에이터는 상위 지역 없이 지역명에 시·도가 올 수 있음. */
export function getKoreaRegion({ area, parentArea }: IntroArea) {
  const name = parentArea ?? area;
  if (name === null) return { label: undefined, region: undefined };
  return {
    label: MAP_LABEL_BY_NAME[name] ?? name,
    region: REGION_BY_NAME[name],
  };
}
