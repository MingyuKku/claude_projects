import { USAGE_KEYWORD_MAX_LENGTH } from "../model/constants";
import { SERVER_USAGE_TYPE } from "../model/usage-types";

import type { UsageQuery } from "../model/usage-types";
import type { FilterValues } from "@/shared/components/list-filter";

function hasKey<T extends object>(
  map: T,
  key: string,
): key is Extract<keyof T, string> {
  return Object.hasOwn(map, key);
}

/** 주소의 필터 값을 서버 요청 조건으로 바꿈(쪽 번호 제외). 값이 없는 조건은 보내지 않음. */
export function toUsageQuery(
  filters: FilterValues,
  entrySize: number,
  keyword = "",
): Omit<UsageQuery, "page"> {
  const { type, dateFrom, dateTo, campaign, usage } = filters;
  const trimmedKeyword = keyword.trim().slice(0, USAGE_KEYWORD_MAX_LENGTH);
  const campaignIdx = campaign ? Number(campaign) : Number.NaN;
  return {
    entrySize,
    ...(type &&
      hasKey(SERVER_USAGE_TYPE, type) && {
        type: SERVER_USAGE_TYPE[type],
      }),
    ...(dateFrom && dateTo && { startDate: dateFrom, endDate: dateTo }),
    ...(Number.isSafeInteger(campaignIdx) && { campaignIdx }),
    // 사용 내역 값은 서버 선택지의 코드 그대로.
    ...(usage && { usageDetailCode: usage }),
    ...(trimmedKeyword && { keyword: trimmedKeyword }),
  };
}
