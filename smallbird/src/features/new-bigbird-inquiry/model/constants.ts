/** 캠페인 선택 표에서 스크롤 없이 보여 주는 행 수. 넘으면 본문만 스크롤함. */
export const VISIBLE_CAMPAIGN_ROWS = 5;

// 공용 Table(xs) 기준 높이: 머리글 48px, 행 48px(아래 선은 행 높이 안에 그려짐, Figma 11315:50062).
// ponytail: 행 높이를 고정값으로 계산하므로 캠페인명이 두 줄로 넘어가면 5행보다 적게 보임.
export const CAMPAIGN_TABLE_HEADER_HEIGHT = "3rem";
export const CAMPAIGN_TABLE_MAX_HEIGHT = `calc(3rem + ${VISIBLE_CAMPAIGN_ROWS} * 3rem)`;
