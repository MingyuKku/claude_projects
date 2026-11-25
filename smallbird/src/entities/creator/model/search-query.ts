/** 상세 필터 수치 항목. 키는 API 파라미터 `{key}Min`·`{key}Max`의 앞부분. */
export const RANGE_FILTER_KEYS = [
  "follower",
  "krFollower",
  "krFollowerRatio",
  "last3MonthRatio",
  "visit",
  "body",
  "reply",
  "like",
  "view",
  "share",
  "replyPeople",
  "brandIndex",
  "groupBuyIndex",
] as const;

export type RangeFilterKey = (typeof RANGE_FILTER_KEYS)[number];

export interface RangeFilterRule {
  /** 슬라이더 최대 눈금. 최대값이 이 값 이상이면 Max를 보내지 않음(서버도 조건을 걸지 않음). */
  sliderMax: number;
  /** 소수 1자리 입력 가능 여부. */
  hasDecimal: boolean;
  /** 상한이 정해진 항목(비율·지수 100). 최대 눈금보다 큰 값을 입력할 수 없고 끝 표시는 `100`. 나머지는 `무제한`. */
  isBounded: boolean;
}

export const RANGE_FILTER_RULES: Record<RangeFilterKey, RangeFilterRule> = {
  follower: { sliderMax: 10_000_000, hasDecimal: false, isBounded: false },
  krFollower: { sliderMax: 10_000_000, hasDecimal: false, isBounded: false },
  krFollowerRatio: { sliderMax: 100, hasDecimal: true, isBounded: true },
  last3MonthRatio: { sliderMax: 100, hasDecimal: true, isBounded: true },
  visit: { sliderMax: 1_000_000, hasDecimal: false, isBounded: false },
  body: { sliderMax: 100_000, hasDecimal: false, isBounded: false },
  reply: { sliderMax: 100_000, hasDecimal: true, isBounded: false },
  like: { sliderMax: 1_000_000, hasDecimal: true, isBounded: false },
  view: { sliderMax: 100_000_000, hasDecimal: true, isBounded: false },
  share: { sliderMax: 1_000_000, hasDecimal: true, isBounded: false },
  replyPeople: { sliderMax: 100_000, hasDecimal: true, isBounded: false },
  brandIndex: { sliderMax: 100, hasDecimal: true, isBounded: true },
  groupBuyIndex: { sliderMax: 100, hasDecimal: true, isBounded: true },
};

/** `max`가 null이면 끝 눈금(무제한 또는 100). */
export interface RangeValue {
  min: number;
  max: number | null;
}

export type RangeFilters = Partial<Record<RangeFilterKey, RangeValue>>;

export const PROFILE_FILTER_KEYS = [
  "influencerServiceIdx",
  "genderIdx",
  "ageIdx",
  "ageGroupIdx",
  "hopeProductIdx",
  "areaIdx",
] as const;

export type ProfileFilterKey = (typeof PROFILE_FILTER_KEYS)[number];

export type ProfileFilters = Partial<Record<ProfileFilterKey, number>>;

/** AI 예측비용·희망비용(원). */
export const COST_FILTER_RULE: RangeFilterRule = {
  sliderMax: 3_000_000,
  hasDecimal: false,
  isBounded: false,
};

export const SEARCH_SORTS = ["FOLLOWER_DESC", "FOLLOWER_ASC"] as const;

export type SearchSort = (typeof SEARCH_SORTS)[number];

/** 검색과 즐겨찾기 목록이 같이 쓰는 조건. */
export interface DetailFilters {
  keyword: string;
  ranges: RangeFilters;
  profile: ProfileFilters;
}

export interface CreatorSearchFilters extends DetailFilters {
  /** 없으면 모든 플랫폼. */
  platformIdx?: number;
  /** 비어 있으면 전체. */
  categoryIdxs: number[];
  aiPredictedCost?: RangeValue;
  desiredCost?: RangeValue;
  sort: SearchSort;
}

type QueryParams = Record<string, string | number | undefined>;

function toRangeParams(
  key: string,
  range: RangeValue | undefined,
  { sliderMax }: RangeFilterRule,
): QueryParams {
  if (!range) return {};
  const params: QueryParams = {};
  if (range.min > 0) params[`${key}Min`] = range.min;
  if (range.max !== null && range.max < sliderMax)
    params[`${key}Max`] = range.max;
  return params;
}

function toDetailParams({ keyword, ranges, profile }: DetailFilters) {
  const params: QueryParams = { keyword: keyword.trim() || undefined };
  for (const key of RANGE_FILTER_KEYS) {
    Object.assign(
      params,
      toRangeParams(key, ranges[key], RANGE_FILTER_RULES[key]),
    );
  }
  for (const key of PROFILE_FILTER_KEYS) params[key] = profile[key];
  return params;
}

/**
 * 검색 API 쿼리. 서버는 `categoryIdxList`가 비면 빈 목록을 주므로 미선택(전체)은 '전체' 카테고리 idx를 보냄.
 * 여러 카테고리는 쉼표로 이어 보냄(Spring 목록 바인딩).
 */
export function toSearchQueryParams(
  filters: CreatorSearchFilters,
  allCategoryIdx: number,
): QueryParams {
  const categoryIdxs = filters.categoryIdxs.length
    ? filters.categoryIdxs
    : [allCategoryIdx];
  return {
    platformIdx: filters.platformIdx,
    categoryIdxList: categoryIdxs.join(","),
    ...toRangeParams(
      "aiPredictedCost",
      filters.aiPredictedCost,
      COST_FILTER_RULE,
    ),
    ...toRangeParams("desiredCost", filters.desiredCost, COST_FILTER_RULE),
    ...toDetailParams(filters),
    sort: filters.sort,
  };
}

export interface BookmarkListFilters extends DetailFilters {
  /** null이면 전체 폴더. */
  folderIdx: number | null;
  /** 없으면 모든 플랫폼. */
  platformIdx?: number;
  /** 비면 모든 카테고리. */
  categoryIdxs: number[];
  aiPredictedCost?: RangeValue;
  desiredCost?: RangeValue;
}

export function toBookmarkQueryParams({
  folderIdx,
  platformIdx,
  categoryIdxs,
  aiPredictedCost,
  desiredCost,
  ...detail
}: BookmarkListFilters): QueryParams {
  return {
    folderIdx: folderIdx ?? undefined,
    platformIdx,
    categoryIdxList: categoryIdxs.length ? categoryIdxs.join(",") : undefined,
    ...toRangeParams("aiPredictedCost", aiPredictedCost, COST_FILTER_RULE),
    ...toRangeParams("desiredCost", desiredCost, COST_FILTER_RULE),
    ...toDetailParams(detail),
  };
}
