/** 목록 한 쪽의 기본 건수(스켈레톤 행 수도 이 값). 서버 기본값과 달라 요청마다 `entrySize`를 명시함. */
export const LIST_PAGE_SIZE = 10;

/** 충전/출금·사용 내역 "N개 보기" 선택지(서버 `entrySize` 10·20·30, docs/mypage-api.md §2). 기본은 맨 앞 값. */
export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 30] as const;

/** "대기 중" 건이 보이는 동안 충전/출금 내역(과 잔액)을 다시 읽는 간격. 입금·출금 처리 시점을 알 수 없어 주기적으로 확인함. */
export const CHARGE_PENDING_REFRESH_INTERVAL_MS = 180_000;
/** 탭 복귀·포커스로 다시 읽는 최소 간격(`visibilitychange`와 `focus`가 연달아 오는 경우 한 번만 읽음). */
export const CHARGE_FOCUS_REFRESH_THROTTLE_MS = 5_000;

export const PAGE_PARAM = "page";
export const SIZE_PARAM = "size";
export const KEYWORD_PARAM = "keyword";

/** 사용 내역 검색어 최대 길이. 넘으면 서버가 `400 INVALID_FILTER`로 거절함(API 명세 A-4). */
export const USAGE_KEYWORD_MAX_LENGTH = 100;

/** 필터·검색·쪽 쿼리. 탭이나 세그먼트를 바꾸면 페이지가 지움. */
export const LIST_QUERY_PARAMS = [
  PAGE_PARAM,
  SIZE_PARAM,
  KEYWORD_PARAM,
  "dateFrom",
  "dateTo",
  "type",
  "status",
  "campaign",
  "usage",
] as const;

/**
 * 빈 목록 묶음의 최대 높이(시안의 빈 표 높이). 이보다 큰 화면에서는 더 늘어나지 않고 위에 붙음.
 */
export const EMPTY_LIST_MAX_HEIGHT_CLASS =
  "max-h-85 tablet:max-h-58 desktop:max-h-76.5";
