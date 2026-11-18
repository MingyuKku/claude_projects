/** 표 셀의 값이 없을 때(null·빈 문자열) 빈칸 대신 보이는 표시. */
export const EMPTY_VALUE = "-";

/** 값이 없거나 공백뿐이면 `EMPTY_VALUE`, 아니면 값을 그대로 돌려줌. 서버 값은 바꾸지 않고 화면에 그릴 때만 씀. */
export function orEmptyValue(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_VALUE;
}
