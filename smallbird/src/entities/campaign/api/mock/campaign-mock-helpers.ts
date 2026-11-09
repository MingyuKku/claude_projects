import { ApiError } from "@/shared/api";
import { fromIsoDate, toIsoDate } from "@/shared/lib";

import { findMockBrand } from "./brand-snapshot";
import { campaignMockDb } from "./campaign-mock-db";

import type { CampaignDetail } from "../../model/schema";

// 목 API가 함께 쓰는 헬퍼. 요구 명세의 오류 규칙(HTTP 상태 + `reason` 코드)을 그대로 흉내 냄.

const CAMPAIGN_DAYS = 30;

export function now() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${toIsoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function fail(
  status: number,
  reason: string,
  extra?: Record<string, unknown>,
): never {
  throw new ApiError(status, { result: false, reason, ...extra });
}

export function requireCampaign(campaignIdx: number): CampaignDetail {
  const campaign = campaignMockDb.get().campaigns[campaignIdx];
  if (!campaign) fail(404, "CAMPAIGN_NOT_FOUND");
  return campaign;
}

/** 시작일 + 30일(서버가 정하는 종료일). */
export function calculateEndDate(startDate: string | null) {
  const start = fromIsoDate(startDate);
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + CAMPAIGN_DAYS);
  return toIsoDate(end);
}

/** 브랜드를 붙이고 종료일을 맞춘 응답 모양으로 바꿈. */
export function withDerivedFields(campaign: CampaignDetail): CampaignDetail {
  return {
    ...campaign,
    campaignInfo: {
      ...campaign.campaignInfo,
      endDate: calculateEndDate(campaign.campaignInfo.startDate),
    },
    brand: findMockBrand(campaign.campaignInfo.brandIdx),
  };
}
