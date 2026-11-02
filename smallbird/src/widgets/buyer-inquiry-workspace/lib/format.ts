import { formatDate } from "@/shared/i18n";

import type {
  BuyerInquiryViewModel,
  InquiryCampaignViewModel,
} from "@/entities/inquiry";
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
  consulting: "green",
  done: "gray",
} satisfies Record<BuyerInquiryViewModel["status"], ChatListBadge["variant"]>;

const OTHER_PREVIEW_LENGTH = 10;

/** 기타 문의 = 캠페인이 없는 문의(기본값, 사용자 확인 전). 정의가 바뀌면 여기만 고침. */
export function isOtherBuyerInquiry(inquiry: BuyerInquiryViewModel) {
  return inquiry.campaignIdx === null;
}

/** 기타 문의 카드 문구: 문의 내용 처음 10자, 넘으면 "..."(REQ-24-0001). */
function toOtherPreview(body: string) {
  const chars = [...body.replace(/\s+/g, " ").trim()];
  return chars.length > OTHER_PREVIEW_LENGTH
    ? `${chars.slice(0, OTHER_PREVIEW_LENGTH).join("").trimEnd()}...`
    : chars.join("");
}

/**
 * 캠페인 문의 카드의 `[브랜드명][캠페인명][공구샵명]` 부분(REQ-24-0001). 서버 값이 먼저이고, 없으면 캠페인 목록에서
 * 찾음. 공구샵명은 서버만 줌. 못 찾은 값은 빈 대괄호 없이 뺌. 하나도 없으면 null.
 */
function toCampaignLabel(
  inquiry: BuyerInquiryViewModel,
  campaign: InquiryCampaignViewModel | undefined,
) {
  const parts = [
    inquiry.brandName ?? campaign?.brandName,
    inquiry.campaignName ?? campaign?.productName,
    inquiry.shopName,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.map((part) => `[${part}]`).join("") : null;
}

export type BuyerCardText =
  { kind: "campaign"; label: string } | { kind: "preview"; text: string };

/** 목록 카드 문구. 캠페인 이름을 하나도 못 찾으면 기타 문의처럼 내용 앞부분을 보임. */
export function getBuyerCardText(
  inquiry: BuyerInquiryViewModel,
  campaigns: readonly InquiryCampaignViewModel[] | undefined,
): BuyerCardText {
  if (!isOtherBuyerInquiry(inquiry)) {
    const campaign = campaigns?.find(
      ({ campaignIdx }) => campaignIdx === inquiry.campaignIdx,
    );
    const label = toCampaignLabel(inquiry, campaign);
    if (label) return { kind: "campaign", label };
  }
  return { kind: "preview", text: toOtherPreview(inquiry.preview) };
}
