import { formatDate } from "@/shared/i18n";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";
import type { ChatListBadge } from "@/shared/components/chat-list";

const TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

/** 목록 카드 날짜 (예: 9월 17일 13:00) */
export function formatListDate(value: Date) {
  return formatDate(value, { month: "long", day: "numeric", ...TIME });
}

/** 대화 날짜 구분 (예: 26. 9. 8. (화)) */
export function formatDividerDate(value: Date) {
  return formatDate(value, {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

/** 상담일 (예: 2027. 05. 29. 11:00) */
export function formatConsultDate(value: Date) {
  return formatDate(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...TIME,
  });
}

export function formatMessageTime(value: Date) {
  return formatDate(value, TIME);
}

export const STATUS_BADGE_VARIANT = {
  waiting: "blue",
  consulting: "green",
  done: "gray",
  failed: "red",
} satisfies Record<BigbirdInquiryViewModel["status"], ChatListBadge["variant"]>;

/** 목록·대화 제목. 캠페인 이름은 문의 생성 때 보낸 캠페인 카드에서 가져옴. */
export function getInquiryTitleKey(inquiry: BigbirdInquiryViewModel) {
  const campaign = inquiry.messages.find(
    (message) => message.campaign,
  )?.campaign;
  if (campaign)
    return {
      key: "inquiryTitle.campaign",
      name: campaign.productName,
    } as const;
  if (inquiry.campaignIdx !== null)
    return { key: "inquiryTitle.campaignUnknown" } as const;
  return { key: "inquiryTitle.other" } as const;
}

export function getLastActivity(inquiry: BigbirdInquiryViewModel) {
  return inquiry.messages.at(-1)?.createdAt ?? inquiry.createdAt;
}
