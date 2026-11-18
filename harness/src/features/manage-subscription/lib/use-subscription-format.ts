import {
  formatDate,
  formatNumber,
  formatNumericDate,
  useTranslation,
} from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib/date-range";

const LONG_DATE_FORMAT = {
  year: "numeric",
  month: "long",
  day: "numeric",
} as const;

/** 구독 결제 상품의 날짜·금액 표시. 금액은 원화 고정이고 숫자만 현재 언어로 포맷함. */
export function useSubscriptionFormat() {
  const { t } = useTranslation("features/manage-subscription");

  return {
    /** 멤버십 시작·종료일(`YYYY-MM-DD`). 읽지 못하면 원문을 그대로 보임. */
    formatMembershipDate: (value: string) => {
      const date = fromIsoDate(value);
      return date ? formatNumericDate(date) : value;
    },
    /** 구독 해지 알럿 본문의 멤버십 종료일("2026년 1월 1일"). */
    formatLongDate: (value: string) => {
      const date = fromIsoDate(value);
      return date ? formatDate(date, LONG_DATE_FORMAT) : value;
    },
    formatWon: (amount: number) => t("won", { amount: formatNumber(amount) }),
  };
}
