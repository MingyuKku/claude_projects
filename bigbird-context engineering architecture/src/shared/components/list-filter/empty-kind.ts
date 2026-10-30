/** 목록이 빈 이유. 0건이면 none, 검색어·필터를 걸었으면 걸린 조건에 따라 나뉨. */
export type EmptyKind = "none" | "search" | "filter" | "searchFilter";

export function resolveEmptyKind(
  keyword: string,
  hasFilter: boolean,
): EmptyKind {
  if (keyword && hasFilter) return "searchFilter";
  if (keyword) return "search";
  if (hasFilter) return "filter";
  return "none";
}
