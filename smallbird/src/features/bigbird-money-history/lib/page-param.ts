/** 주소의 쪽 번호. 1 이상의 정수만 받고 그 밖(소수·지수·16진수·음수·문자)은 1쪽으로 봄. */
export function parsePageParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/** 주소의 "N개 보기". 선택지에 없는 값은 맨 앞 값(기본)으로 봄. */
export function parsePageSizeParam(
  value: string | null,
  options: readonly [number, ...number[]],
) {
  return options.find((option) => String(option) === value) ?? options[0];
}
