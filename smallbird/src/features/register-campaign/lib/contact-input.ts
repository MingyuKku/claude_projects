/** 연락처 칸은 숫자와 하이픈만 받음. 그 밖의 글자는 버림. */
export function sanitizeContactInput(raw: string) {
  return raw.replace(/[^0-9-]/g, "");
}
