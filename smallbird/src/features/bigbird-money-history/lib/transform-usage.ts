import { parseServerDate } from "@/entities/account";

import {
  CAMPAIGN_TYPES,
  NON_CAMPAIGN_USAGE_TYPES,
  SERVER_USAGE_DETAIL,
  SERVER_USAGE_TYPE,
  USAGE_DETAILS,
  USAGE_TYPES,
} from "../model/usage-types";

import type { UsageList } from "../model/usage-schema";
import type {
  CampaignType,
  UsageDetail,
  UsageListViewModel,
  UsageType,
} from "../model/usage-types";

// 객체 리터럴이면 `constructor`·`toString` 같은 프로토타입 이름도 조회되므로 Map으로 둠.
const USAGE_TYPE_BY_SERVER_VALUE = new Map<string, UsageType>(
  USAGE_TYPES.map((type) => [SERVER_USAGE_TYPE[type], type]),
);
const USAGE_DETAIL_BY_SERVER_VALUE = new Map<string, UsageDetail>(
  USAGE_DETAILS.map((detail) => [SERVER_USAGE_DETAIL[detail], detail]),
);
const CAMPAIGN_TYPE_BY_SERVER_VALUE = new Map<string, CampaignType>(
  CAMPAIGN_TYPES.map((type) => [type, type]),
);

/** 서버 사용 내역 코드를 화면 코드로 바꿈. 번역이 없는 코드는 null이라 호출하는 쪽이 서버 문구를 보임. */
export function toUsageDetail(serverValue: string | null | undefined) {
  return USAGE_DETAIL_BY_SERVER_VALUE.get(serverValue ?? "") ?? null;
}

// 값이 없으면 빈 문자열. 표 셀은 그릴 때 `orEmptyValue`로 "-"를 보임(카드·상세는 빈칸 그대로).
function textOrEmpty(value: string | null | undefined) {
  return value?.trim() ? value : "";
}

export function transformUsageList(list: UsageList): UsageListViewModel {
  return {
    records: list.list.map((item) => {
      const type = USAGE_TYPE_BY_SERVER_VALUE.get(item.type) ?? null;
      // 충전·출금은 캠페인과 무관해 서버 "-"도 빈 값으로 정규화함(표 셀은 "-"로 그림).
      const isCampaignFree =
        type !== null && NON_CAMPAIGN_USAGE_TYPES.includes(type);
      const campaignText = (value: string | null | undefined) =>
        isCampaignFree ? "" : textOrEmpty(value);
      const target = item.contractTarget;

      return {
        id: item.id,
        type,
        typeText: textOrEmpty(item.type),
        usedAt: parseServerDate(item.usageDate),
        usedAtText: textOrEmpty(item.usageDate),
        campaignName: campaignText(item.campaignName),
        campaignCode: campaignText(item.campaignCode),
        campaignImageUrl: isCampaignFree ? null : item.mainImageUrl || null,
        campaignType: isCampaignFree
          ? null
          : (CAMPAIGN_TYPE_BY_SERVER_VALUE.get(item.campaignType ?? "") ??
            null),
        campaignTypeText: campaignText(item.campaignType),
        usageDetail: isCampaignFree
          ? null
          : toUsageDetail(item.usageDetailCode),
        usageDetailText: campaignText(item.usageDetailName),
        amount: item.usageAmount ?? null,
        remainingAmount: item.remainingAmount ?? null,
        contractTarget:
          !isCampaignFree && target
            ? {
                name: target.name?.trim() ?? "",
                influencerId: target.influencerId?.trim() ?? "",
              }
            : null,
      };
    }),
    totalCount: list.count,
    page: list.currentPage,
    totalPages: Math.ceil(list.count / Math.max(list.entrySize, 1)),
  };
}
