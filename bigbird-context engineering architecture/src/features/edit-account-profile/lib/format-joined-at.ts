import { formatDate } from "@/shared/i18n";

/** 가입일을 현재 언어의 `yyyy.MM.dd` 꼴로 보임. 값이 없으면 빈 문자열(Sub ID 응답엔 가입일이 없음). */
export function formatJoinedAt(joinedAt: Date | null | undefined) {
  if (!joinedAt) return "";
  return formatDate(joinedAt, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
