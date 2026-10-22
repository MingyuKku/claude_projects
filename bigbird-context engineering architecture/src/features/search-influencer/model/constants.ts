export const MAX_QUERY_LENGTH = 1000;

export const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
export const DESKTOP_MEDIA_QUERY = "(min-width: 1440px)";
export const TOUCH_MEDIA_QUERY = "(pointer: coarse)";

// `leading-5`(20px). getComputedStyle이 line-height를 숫자로 주지 못하는 환경의 대비값.
export const FALLBACK_LINE_HEIGHT = 20;

// 모달을 열 때 쌓는 history 항목의 state 표식.
export const EXPANDED_HISTORY_STATE_KEY = "searchExpanded";
