import { formatDate } from "@/shared/i18n";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";
import type { ChatListBadge } from "@/shared/components/chat-list";

const TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

/** 대화 날짜 구분 (예: 26. 9. 8. (화)) */
export function formatDividerDate(value: Date) {
  return formatDate(value, {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

export function formatMessageTime(value: Date) {
  return formatDate(value, TIME);
}

/** 목록 카드 날짜 (예: 9월 17일 13:00) */
export function formatListDate(value: Date) {
  return formatDate(value, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export const STATUS_BADGE_VARIANT = {
  waiting: "blue",
  done: "gray",
} satisfies Record<BuyerInquiryViewModel["status"], ChatListBadge["variant"]>;
