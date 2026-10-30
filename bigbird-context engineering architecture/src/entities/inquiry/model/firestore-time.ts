const pad = (value: number) => String(value).padStart(2, "0");

/**
 * 백엔드가 쓴 일반 문의 문서의 `finishTime`은 Firestore Timestamp이고, 프론트·운영 앱이 쓰는 값은 `yyyy-MM-dd HH:mm:ss`
 * 문자열임(2026-10-29 dev 문서 확인). 읽을 때 문자열로 통일함. Timestamp가 아닌 값은 그대로 둠.
 */
export function normalizeFirestoreTime(value: unknown): unknown {
  if (
    typeof value !== "object" ||
    value === null ||
    !("toDate" in value) ||
    typeof value.toDate !== "function"
  )
    return value;
  const date = value.toDate() as Date;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
