import {
  formatDate,
  formatNumber,
  formatNumericDate,
  formatNumericDateTime,
  useTranslation,
} from "@/shared/i18n";

import { getRemainingTime } from "../lib/remaining-time";

const CHAT_TIME = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
} as const;

function toDate(value: string) {
  // 서버 날짜(`yyyy-MM-dd`)는 시간대 없이 그 날로 읽음.
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 매칭 목록·상세의 금액·일시·남은 시간 표기. 값이 없으면 "-". */
/** `now`는 남은 시간 표기에만 씀(없으면 "-"). */
export function useProposalFormat(now?: number) {
  const { t } = useTranslation("features/campaign-matching");

  return {
    formatWon: (amount: number) => t("won", { amount: formatNumber(amount) }),
    formatDateTime: (value: string | null) => {
      if (!value) return "-";
      const date = toDate(value);
      return date ? formatNumericDateTime(date) : value;
    },
    /** 대화 말풍선 옆 시각(24시간제 시:분). */
    formatTime: (value: string | null) => {
      const date = value ? toDate(value) : null;
      return date ? formatDate(date, CHAT_TIME) : undefined;
    },
    /** 시작~끝 날짜. 둘 다 없으면 "-". */
    formatDateRange: (start: string | null, end: string | null) => {
      if (!start && !end) return "-";
      const format = (value: string | null) => {
        const date = value ? toDate(value) : null;
        return date ? formatNumericDate(date) : (value ?? "");
      };
      return `${format(start)} ~ ${format(end)}`;
    },
    formatRemaining: (deadline: string | null) => {
      if (now === undefined) return "-";
      const left = getRemainingTime(deadline, now);
      if (!left) return "-";
      return left.unit === "day"
        ? t("remaining.day", { days: left.days, hours: left.hours })
        : t("remaining.hour", { hours: left.hours, minutes: left.minutes });
    },
  };
}
