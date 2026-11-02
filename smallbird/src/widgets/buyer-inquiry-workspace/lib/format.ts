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

const PREVIEW_LENGTH = 10;

/** 캠페인 이름을 못 찾을 때 대신 보이는 문의 내용 처음 10자, 넘으면 "...". */
function toPreview(body: string) {
  const chars = [...body.replace(/\s+/g, " ").trim()];
  return chars.length > PREVIEW_LENGTH
    ? `${chars.slice(0, PREVIEW_LENGTH).join("").trimEnd()}...`
    : chars.join("");
}

export type BuyerCardText =
  | { kind: "campaign"; brandName: string | null; campaignName: string }
  | { kind: "preview"; text: string };

/**
 * 목록 카드 첫 줄(Figma 26/10/29 11315:50439): 회색 브랜드명 + "캠페인명 문의". 구매자 문의·상품 Q&A는 모두 캠페인에서
 * 오므로 이름은 서버 값을 먼저, 없으면 캠페인 목록에서 찾음. 캠페인명을 못 찾으면(데이터 누락) 문의 내용 앞부분.
 */
export function getBuyerCardText(
  inquiry: BuyerInquiryViewModel,
  campaigns: readonly InquiryCampaignViewModel[] | undefined,
): BuyerCardText {
  const campaign = campaigns?.find(
    ({ campaignIdx }) => campaignIdx === inquiry.campaignIdx,
  );
  const campaignName = (inquiry.campaignName ?? campaign?.productName)?.trim();
  if (!campaignName)
    return { kind: "preview", text: toPreview(inquiry.preview) };
  const brandName = (inquiry.brandName ?? campaign?.brandName)?.trim() || null;
  return { kind: "campaign", brandName, campaignName };
}
