import {
  formatNumber,
  formatNumericDateTime,
  useTranslation,
} from "@/shared/i18n";

/** 충전·사용 내역 화면의 날짜·금액 표시. 금액은 원화 고정이고 숫자만 현재 언어로 포맷함. */
export function useMoneyFormat() {
  const { t } = useTranslation("features/bigbird-money-history");

  return {
    /** 서버 날짜를 읽지 못했으면 원문(`text`)을 그대로 보여 줌. */
    formatDateTime: (date: Date | null, text: string) =>
      date ? formatNumericDateTime(date) : text,
    /** 값이 없으면 빈 문자열. */
    formatWon: (amount: number | null) =>
      amount === null ? "" : t("won", { amount: formatNumber(amount) }),
    /** 차감은 "-", 반환은 "+"를 붙임. 값이 없으면 빈 문자열. */
    formatSignedWon: (amount: number | null) =>
      amount === null
        ? ""
        : t("won", {
            amount: formatNumber(amount, { signDisplay: "exceptZero" }),
          }),
  };
}
