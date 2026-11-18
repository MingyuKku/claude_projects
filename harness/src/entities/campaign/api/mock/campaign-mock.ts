import { ApiError } from "@/shared/api";

import {
  CAMPAIGN_PAGE_SIZE,
  COPY_SOURCE_PAGE_SIZE,
  getTypeFilterCodes,
} from "../../model/codes";
import { campaignMockDb, toListItem } from "./campaign-db";

import type { CampaignListResponse } from "../../model/schema";
import type { CampaignListQuery, CopySourceQuery } from "../../model/types";

// 캠페인 목록·삭제(A-2·A-4)의 목. 저장소는 상세·단계별 수정 목과 같은 것을 씀.

/** 서버처럼 상태·유형·검색(캠페인명·브랜드명)을 걸러 최초 등록일(여기서는 번호) 최신순으로 한 쪽을 줌(A-2). */
export async function listCampaigns(
  query: CampaignListQuery,
): Promise<CampaignListResponse> {
  const keyword = query.keyword.trim().toLowerCase();
  const codes = query.type ? getTypeFilterCodes(query.type) : null;
  const matched = campaignMockDb
    .get()
    .campaigns.map(toListItem)
    .filter(
      (item) =>
        (query.statuses.length === 0 ||
          query.statuses.some((status) => status === item.status)) &&
        (!codes ||
          (item.serviceType === codes.serviceType &&
            item.productType === codes.productType)) &&
        (!keyword ||
          (item.name ?? "").toLowerCase().includes(keyword) ||
          (item.brandName ?? "").toLowerCase().includes(keyword)),
    )
    .sort((a, b) => b.campaignIdx - a.campaignIdx);
  const start = (query.page - 1) * CAMPAIGN_PAGE_SIZE;
  return {
    list: matched.slice(start, start + CAMPAIGN_PAGE_SIZE),
    count: matched.length,
    currentPage: query.page,
    entrySize: CAMPAIGN_PAGE_SIZE,
  };
}

/** 이전 캠페인 불러오기 목록(A-2). 같은 서비스·상품 유형이면 상태와 관계없이(데모 포함) 주고 지금 캠페인은 뺌(Q-15). */
export async function listCopySources(
  query: CopySourceQuery,
  page: number,
): Promise<CampaignListResponse> {
  const keyword = query.keyword.trim().toLowerCase();
  const matched = campaignMockDb
    .get()
    .campaigns.map(toListItem)
    .filter(
      (item) =>
        item.serviceType === query.serviceType &&
        item.productType === query.productType &&
        item.campaignIdx !== query.excludeCampaignIdx &&
        (!keyword ||
          (item.name ?? "").toLowerCase().includes(keyword) ||
          (item.brandName ?? "").toLowerCase().includes(keyword)),
    )
    .sort((a, b) => b.campaignIdx - a.campaignIdx);
  const start = (page - 1) * COPY_SOURCE_PAGE_SIZE;
  return {
    list: matched.slice(start, start + COPY_SOURCE_PAGE_SIZE),
    count: matched.length,
    currentPage: page,
    entrySize: COPY_SOURCE_PAGE_SIZE,
  };
}

/** 등록 중(`DRAFT`)만 지움. 아니면 409 `NOT_DELETABLE`(A-4). */
export async function deleteCampaign(campaignIdx: number): Promise<void> {
  const target = campaignMockDb
    .get()
    .campaigns.find((item) => item.campaignIdx === campaignIdx);
  if (!target) throw new ApiError(404, { reason: "CAMPAIGN_NOT_FOUND" });
  if (target.status !== "DRAFT") {
    throw new ApiError(409, { reason: "NOT_DELETABLE" });
  }
  campaignMockDb.update((db) => {
    db.campaigns = db.campaigns.filter(
      (item) => item.campaignIdx !== campaignIdx,
    );
  });
}
