import {
  CAMPAIGN_PAGE_SIZE,
  COPY_SOURCE_PAGE_SIZE,
  getTypeFilterCodes,
} from "../model/codes";

import type { CampaignListQuery, CopySourceQuery } from "../model/types";

// 목록 조회 쿼리 파라미터. 값이 없는 조건은 키를 보내지 않음(서버는 없으면 전체).

export type CampaignListParams = {
  status?: string;
  serviceType?: string;
  productType?: string;
  keyword?: string;
  excludeCampaignIdx?: number;
  page: number;
  entrySize: number;
};

/** 현황 목록. 상태는 콤마로 이어 보내고 유형 필터는 서비스·상품 코드로 나눠 보냄. */
export function toCampaignListParams(
  query: CampaignListQuery,
): CampaignListParams {
  const keyword = query.keyword.trim();
  const typeCodes = query.type ? getTypeFilterCodes(query.type) : null;
  return {
    ...(query.statuses.length > 0 && { status: query.statuses.join(",") }),
    ...(typeCodes && {
      serviceType: typeCodes.serviceType,
      productType: typeCodes.productType,
    }),
    ...(keyword && { keyword }),
    page: query.page,
    entrySize: CAMPAIGN_PAGE_SIZE,
  };
}

/** 이전 캠페인 불러오기. 상태는 거르지 않아 `status`를 보내지 않음. */
export function toCopySourceParams(
  query: CopySourceQuery,
  page: number,
): CampaignListParams {
  const keyword = query.keyword.trim();
  return {
    serviceType: query.serviceType,
    productType: query.productType,
    ...(keyword && { keyword }),
    excludeCampaignIdx: query.excludeCampaignIdx,
    page,
    entrySize: COPY_SOURCE_PAGE_SIZE,
  };
}
