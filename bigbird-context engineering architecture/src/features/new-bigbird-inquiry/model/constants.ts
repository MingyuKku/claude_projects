/** 캠페인 선택 표에서 스크롤 없이 보여 주는 행 수. 넘으면 본문만 스크롤함. */
export const VISIBLE_CAMPAIGN_ROWS = 5;

// 공용 Table(sm) 기준 높이: 머리글 py-3 + leading-6 = 48px, 행 h-14 = 56px, 각각 아래 테두리 1px.
// ponytail: 행 높이를 고정값으로 계산하므로 캠페인명이 두 줄로 넘어가면 5행보다 적게 보임.
export const CAMPAIGN_TABLE_HEADER_HEIGHT = "calc(3rem + 1px)";
export const CAMPAIGN_TABLE_MAX_HEIGHT = `calc(3rem + 1px + ${VISIBLE_CAMPAIGN_ROWS} * (3.5rem + 1px))`;
