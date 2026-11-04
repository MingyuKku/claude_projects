import { INQUIRY_SOURCE_TYPE } from "@/entities/inquiry";
import { fromIsoDate } from "@/shared/lib/date-range";

import { INQUIRY_MENU } from "../model/menu";

import type { InquiryMenu } from "../model/menu";
import type {
  BuyerInquirySource,
  BuyerInquiryStatusFilter,
  BuyerInquiryFilters,
} from "@/entities/inquiry";

// Figma 26/10/29(11315:50439) 탭 순서: 전체 · 답변 대기 · 상담 중 · 답변 완료
export const STATUS_FILTERS = ["all", "waiting", "consulting", "done"] as const;

/** 구매자 문의 탭 순서(요구명세서 24 I5). 인플루언서 문의는 STATUS_FILTERS 순서를 그대로 씀. */
export const BUYER_STATUS_FILTERS = [
  "all",
  "consulting",
  "waiting",
  "done",
] as const;

function toPositiveNumber(value: string | null) {
  const number = Number(value);
  return value !== null && Number.isSafeInteger(number) && number > 0
    ? number
    : undefined;
}

/** URL의 `?source=`(출처 값)를 서버 sourceType으로. 이 메뉴의 출처가 아니면 전체. */
export function toBuyerInquiryFilters(
  params: URLSearchParams,
  menu: InquiryMenu,
): BuyerInquiryFilters {
  const source = INQUIRY_MENU[menu].sources.find(
    (item) => item === params.get("source"),
  );
  const campaignIdx = toPositiveNumber(params.get("campaignIdx"));
  // 등록일은 시작일·종료일이 모두 올바를 때만 적용합니다(서버도 둘을 함께 받습니다).
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const hasDateRange =
    fromIsoDate(startDate) !== undefined && fromIsoDate(endDate) !== undefined;
  return {
    sourceType: source ? INQUIRY_SOURCE_TYPE[source] : "ALL",
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

/** 서버 sourceType을 URL의 `?source=` 값으로. 전체면 undefined. */
export function toSourceParam(
  sourceType: BuyerInquiryFilters["sourceType"],
): BuyerInquirySource | undefined {
  return (Object.keys(INQUIRY_SOURCE_TYPE) as BuyerInquirySource[]).find(
    (source) => INQUIRY_SOURCE_TYPE[source] === sourceType,
  );
}
