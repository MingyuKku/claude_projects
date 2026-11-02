import { formatDate, formatNumber, useTranslation } from "@/shared/i18n";

/** 일시. 현재 언어로 같은 형식을 씀. */
const DATE_TIME_FORMAT = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
} as const;

/** 충전·사용 내역 화면의 날짜·금액 표시. 금액은 원화 고정이고 숫자만 현재 언어로 포맷함. */
export function useMoneyFormat() {
  const { t } = useTranslation("features/bigbird-money-history");

  return {
    /** 서버 날짜를 읽지 못했으면 원문(`text`)을 그대로 보여 줌. */
    formatDateTime: (date: Date | null, text: string) =>
      date ? formatDate(date, DATE_TIME_FORMAT) : text,
    formatWon: (amount: number | null) =>
      amount === null ? "-" : t("won", { amount: formatNumber(amount) }),
    /** 차감은 "-", 반환은 "+"를 붙임. */
    formatSignedWon: (amount: number | null) =>
      amount === null
        ? "-"
        : t("won", {
            amount: formatNumber(amount, { signDisplay: "exceptZero" }),
          }),
  };
}
