import { parseServerDate } from "@/entities/account";

import { LIST_PAGE_SIZE } from "../model/constants";

import type { UsageList } from "../model/usage-schema";
import type { UsageListViewModel } from "../model/usage-types";

const EMPTY_TEXT = "-";

function textOrDash(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_TEXT;
}

export function transformUsageList(list: UsageList): UsageListViewModel {
  return {
    records: list.list.map((item, index) => ({
      id: String(index),
      usedAt: parseServerDate(item.usageDate),
      usedAtText: textOrDash(item.usageDate),
      campaignName: textOrDash(item.campaignName),
      campaignCode: textOrDash(item.campaignCode),
      campaignType: textOrDash(item.campaignService),
      usageLabel: textOrDash(item.usageDetails ?? item.usageType),
      amount: item.usageAmount ?? null,
      remainingAmount: item.remainingAmount ?? null,
    })),
    totalCount: list.count,
    page: list.currentPage,
    totalPages: Math.ceil(list.count / LIST_PAGE_SIZE),
  };
}
