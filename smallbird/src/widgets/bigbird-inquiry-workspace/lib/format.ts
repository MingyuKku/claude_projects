import { formatDate } from "@/shared/i18n";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";
import type { ChatListBadge } from "@/shared/components/chat-list";

const TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

/** 목록 카드 날짜 (예: 26년 9월 17일 13:00) */
export function formatListDate(value: Date) {
  return formatDate(value, {
    year: "2-digit",
    month: "long",
    day: "numeric",
    ...TIME,
  });
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

export function formatMessageTime(value: Date) {
  return formatDate(value, TIME);
}

export const STATUS_BADGE_VARIANT = {
  waiting: "blue",
  consulting: "green",
  done: "gray",
  failed: "red",
} satisfies Record<BigbirdInquiryViewModel["status"], ChatListBadge["variant"]>;

/**
 * 목록·대화 제목. 캠페인 이름은 목록 응답의 상품명(종료 캠페인도 있음)을 먼저 쓰고, 없으면 광고주의 캠페인 목록
 * (`productName`)에서 찾음. 목록 응답에는 메시지가 없어 대화를 받은 뒤에는 문의 생성 때 보낸 캠페인 카드로도 찾음.
 */
export function getInquiryTitleKey(
  inquiry: BigbirdInquiryViewModel,
  productName?: string,
) {
  const name =
    inquiry.productName?.trim() ||
    productName?.trim() ||
    inquiry.messages.find((message) => message.campaign)?.campaign?.productName;
  if (name) return { key: "inquiryTitle.campaign", name } as const;
  if (inquiry.campaignIdx !== null)
    return { key: "inquiryTitle.campaignUnknown" } as const;
  return { key: "inquiryTitle.other" } as const;
}

/** 기타 문의 카드 제목에 쓰는 최근 메시지 길이(REQ-23-0002). 넘으면 "..."을 붙임. */
const OTHER_PREVIEW_LENGTH = 20;

/** 기타 문의 카드의 최근 메시지 미리보기. 글 메시지가 없으면 null. */
export function getOtherInquiryPreview(inquiry: BigbirdInquiryViewModel) {
  const body = inquiry.messages
    .filter((message) => message.kind === "text" && !message.isDeleted)
    .at(-1)
    ?.body.replace(/\s+/g, " ")
    .trim();
  if (!body) return null;
  const chars = [...body];
  return chars.length > OTHER_PREVIEW_LENGTH
    ? `${chars.slice(0, OTHER_PREVIEW_LENGTH).join("").trimEnd()}...`
    : body;
}

export function getLastActivity(inquiry: BigbirdInquiryViewModel) {
  return inquiry.messages.at(-1)?.createdAt ?? inquiry.createdAt;
}
