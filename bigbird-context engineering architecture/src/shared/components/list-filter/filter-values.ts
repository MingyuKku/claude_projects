import { fromIsoDate } from "@/shared/lib/date-range";

import type { FilterField, FilterValues } from "./filter-fields";

/** 필드가 쓰는 쿼리 이름. 날짜는 시작·종료 두 개. */
export function fieldQueryKeys(field: FilterField) {
  return field.type === "date"
    ? [`${field.id}From`, `${field.id}To`]
    : [field.id];
}

/**
 * 주소의 쿼리에서 필터 값을 읽음. 날짜는 시작·종료가 모두 올바른 `yyyy-MM-dd`일 때만 인정하고
 * (시작일만 고른 중간 상태는 적용되지 않음), 선택지에 없는 값은 버려 직접 고친 주소가 화면을 깨지 않게 함.
 * 비활성 필드는 서버에 보내지 않으므로 값을 가질 수 없음(주소로 넣어도 읽지 않음).
 */
export function readFilterValues(
  searchParams: URLSearchParams,
  fields: FilterField[],
): FilterValues {
  const values: FilterValues = {};
  for (const field of fields) {
    if (field.isDisabled) continue;
    if (field.type === "date") {
      const from = searchParams.get(`${field.id}From`);
      const to = searchParams.get(`${field.id}To`);
      if (fromIsoDate(from) && fromIsoDate(to)) {
        values[`${field.id}From`] = from as string;
        values[`${field.id}To`] = to as string;
      }
      continue;
    }
    const selected = searchParams.get(field.id);
    if (selected && field.options.some((option) => option.value === selected)) {
      values[field.id] = selected;
    }
  }
  return values;
}

/** 필터를 하나라도 걸었는지. */
export function hasActiveFilter(values: FilterValues) {
  return Object.keys(values).length > 0;
}

/** 두 필터 값이 같은지(적용하기 버튼의 활성 조건). */
export function isSameFilterValues(a: FilterValues, b: FilterValues) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => a[key] === b[key]);
}

/**
 * 주소의 쿼리에 필터 값을 적용함. 이 필드들의 쿼리는 모두 지우고 `values`만 다시 씀.
 * 필터가 바뀌면 결과가 달라지므로 쪽은 처음으로 돌림.
 */
export function applyFilterValues(
  params: URLSearchParams,
  fields: FilterField[],
  values: FilterValues,
  pageParam: string,
) {
  for (const field of fields) {
    for (const key of fieldQueryKeys(field)) params.delete(key);
  }
  for (const [key, value] of Object.entries(values)) params.set(key, value);
  params.delete(pageParam);
}
