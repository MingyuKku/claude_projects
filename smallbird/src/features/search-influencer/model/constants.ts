import type { InfluencerPlatform } from "@/entities/platform";

// 처음 보이는 플랫폼. 선택 해제는 지원하지 않으므로 검색은 항상 플랫폼 하나를 가짐.
export const DEFAULT_PLATFORM: InfluencerPlatform = "instagram";

// `leading-5`(20px). getComputedStyle이 line-height를 숫자로 주지 못하는 환경의 대비값.
export const FALLBACK_LINE_HEIGHT = 20;

// 펼치기 전 입력창이 늘어나는 최대 줄 수. 넘으면 입력창 안에서 스크롤함(Tailwind `max-h-[8lh]`와 같은 값).
export const MAX_VISIBLE_LINES = 8;

// 글이 이 줄 수를 넘으면 펼치기 아이콘이 나타남. PC는 4줄부터 입력창이 늘어나면서(Figma Filled-Full-Min),
// 모바일은 챗지피티 웹처럼 최대 줄 수를 넘어 입력창 안에서 스크롤이 생길 때(2026-10-27 사용자 지시).
export const EXPAND_ACTION_MIN_LINES = 4;
export const MOBILE_EXPAND_ACTION_MIN_LINES = MAX_VISIBLE_LINES;

// 펼친 입력창이 덮을 영역의 위쪽 기준이 되는 요소의 표식(페이지가 붙임).
export const EXPAND_BOUNDARY_ATTRIBUTE = "data-search-expand-boundary";

// 펼치기·축소 높이 전환. 펼칠 때는 눌렀을 때 바로 반응하도록 처음부터 빠르게 움직이고 끝에서 길게 가라앉는 곡선(easeOutQuint)이고,
// 접을 때는 시작이 조금 부드러운 곡선(iOS 시트·Linear 계열)임. 모션 줄이기를 켜면 건너뜀.
export const EXPAND_TRANSITION_DURATION = 360;
export const COLLAPSE_TRANSITION_DURATION = 280;
export const EXPAND_TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const COLLAPSE_TRANSITION_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
// 클릭 뒤 렌더·레이아웃에 쓴 시간(약 11ms)과 진행 0인 첫 프레임 때문에 눈에 보이는 움직임이 늦어지므로, 전환을 한 프레임 앞선 지점에서 시작함.
export const EXPAND_TRANSITION_LEAD = 16;
