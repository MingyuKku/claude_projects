const pad = (value: number) => String(value).padStart(2, "0");

function toDate(value: unknown): Date | null {
  if (typeof value !== "object" || value === null) return null;
  if ("toDate" in value && typeof value.toDate === "function")
    return value.toDate() as Date;
  // 서버가 Timestamp를 일반 맵으로 쓴 값({type:"firestore/timestamp/1.0", seconds, nanoseconds}, stage 2026-11-03
  // acceptedAt)도 같은 시각으로 읽음.
  if ("seconds" in value && typeof value.seconds === "number") {
    const nanoseconds =
      "nanoseconds" in value && typeof value.nanoseconds === "number"
        ? value.nanoseconds
        : 0;
    return new Date(value.seconds * 1000 + Math.floor(nanoseconds / 1e6));
  }
  return null;
}

/**
 * 백엔드가 쓴 시각은 Firestore Timestamp(또는 그것을 직렬화한 맵)이고, 프론트·운영 앱이 쓰는 값은 `yyyy-MM-dd HH:mm:ss`
 * 문자열임. 읽을 때 문자열로 통일함. 시각이 아닌 값은 그대로 둠.
 */
export function normalizeFirestoreTime(value: unknown): unknown {
  const date = toDate(value);
  if (!date) return value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
