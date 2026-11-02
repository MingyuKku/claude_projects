import { fromIsoDate } from "@/shared/lib/date-range";

import type {
  BuyerInquiryStatusFilter,
  BuyerInquiryFilters,
} from "@/entities/inquiry";

export const STATUS_FILTERS = ["all", "waiting", "done"] as const;

function toPositiveNumber(value: string | null) {
  const number = Number(value);
  return value !== null && Number.isSafeInteger(number) && number > 0
    ? number
    : undefined;
}

export function toBuyerInquiryFilters(
  params: URLSearchParams,
): BuyerInquiryFilters {
  const source = params.get("source");
  const campaignIdx = toPositiveNumber(params.get("campaignIdx"));
  // 등록일은 시작일·종료일이 모두 올바를 때만 적용합니다(서버도 둘을 함께 받습니다).
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const hasDateRange =
    fromIsoDate(startDate) !== undefined && fromIsoDate(endDate) !== undefined;
  return {
    sourceType:
      source === "purchaser"
        ? "PURCHASER_QUESTION"
        : source === "qna"
          ? "PRODUCT_QNA"
          : "ALL",
    campaignIdx,
    influencerThreadUserIdx:
      campaignIdx === undefined
        ? undefined
        : toPositiveNumber(params.get("influencerThreadUserIdx")),
    keyword: params.get("q")?.trim() || undefined,
    startDate: hasDateRange ? (startDate ?? undefined) : undefined,
    endDate: hasDateRange ? (endDate ?? undefined) : undefined,
  };
}

/** URL의 `?status=` 값을 목록 필터로 바꿈. 모르는 값은 전체. */
export function toBuyerStatusFilter(
  value: string | null,
): BuyerInquiryStatusFilter {
  return STATUS_FILTERS.find((filter) => filter === value) ?? "all";
}
