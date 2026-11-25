import { sort } from "radash";

import type {
  MatchingPlatform,
  MatchingPlatformCode,
} from "@/entities/creator";

/** 플랫폼 메뉴 순서. 서버 platformIdx 순서(유튜브·X·틱톡)와 다름. */
const PLATFORM_MENU_ORDER: readonly MatchingPlatformCode[] = [
  "instagram",
  "naver",
  "youtube",
  "tiktok",
  "x",
];

function getMenuOrder({ code }: MatchingPlatform) {
  const order = code ? PLATFORM_MENU_ORDER.indexOf(code) : -1;
  return order === -1 ? PLATFORM_MENU_ORDER.length : order;
}

export function sortPlatformsByMenu(platforms: MatchingPlatform[]) {
  return sort(platforms, getMenuOrder);
}

/** 항목이 이 수를 넘으면 메뉴가 5개 높이로 줄고 스크롤함. */
export const MENU_MAX_VISIBLE_COUNT = 6;
