import {
  formatNumber,
  formatNumericDateTime,
  useTranslation,
} from "@/shared/i18n";

/** 결제 내역의 일시·금액 표시. 금액은 원화 고정이고 숫자만 현재 언어로 포맷함. */
export function usePaymentFormat() {
  const { t } = useTranslation("features/payment-history");

  return {
    /** 읽지 못한 일시는 원문을 그대로 보임. */
    formatDateTime: (value: string) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : formatNumericDateTime(date);
    },
    formatWon: (amount: number) => t("won", { amount: formatNumber(amount) }),
  };
}
