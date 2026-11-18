import { ApiError } from "@/shared/api";
import { isCampaignApiMock } from "@/shared/config";
import { createMockStore, mockBrandDb } from "@/shared/lib";

import { SEEDS, toSeedRecord } from "./campaign-seeds";

import type { CampaignDetailResponse } from "../../model/detail-schema";
import type { CampaignListItem } from "../../model/schema";
import type { MockCampaignRecord } from "./campaign-record";

// 캠페인 목록·상세·단계별 수정·불러오기 목이 함께 쓰는 저장소. 응답 모양은 API 요구 명세(2026-11-12 개편판)를 따름.
// 브랜드명·로고는 저장하지 않고 읽을 때 브랜드 목 저장소에서 이어 붙임(실제 서버처럼 브랜드 삭제가 바로 보이게).

interface CampaignMockDb {
  nextCampaignIdx: number;
  campaigns: MockCampaignRecord[];
}

const EDITABLE_STATUSES = ["DRAFT", "REJECTED"];

// 전체 목 모드는 시드가 있는 목 캠페인을 쓰고, 서버 연동 모드는 서버 캠페인에 덧씌울 상태(결제·승인·정책 동의·데모)만 담는
// 비어 있는 저장소를 씀(campaign-shadow). 두 저장소가 섞이지 않게 키를 나눔.
export const campaignMockDb = isCampaignApiMock()
  ? createMockStore<CampaignMockDb>("bigbird:mock:campaign-db", () => ({
      nextCampaignIdx: SEEDS.length + 1,
      campaigns: SEEDS.map(toSeedRecord),
    }))
  : createMockStore<CampaignMockDb>("bigbird:mock:campaign-shadow-db", () => ({
      nextCampaignIdx: 1,
      campaigns: [],
    }));

export function findCampaignRecord(campaignIdx: number) {
  const record = campaignMockDb
    .get()
    .campaigns.find((item) => item.campaignIdx === campaignIdx);
  if (!record) throw new ApiError(404, { reason: "CAMPAIGN_NOT_FOUND" });
  return record;
}

/** 단계별 수정·불러오기를 받을 수 있는 상태인지(A-5 공통 규칙, 작성을 마친 데모 포함). */
export function assertEditable(record: MockCampaignRecord) {
  const isEditable =
    EDITABLE_STATUSES.includes(record.status) && !record.demoCompleted;
  if (!isEditable) throw new ApiError(409, { reason: "NOT_EDITABLE" });
}

export function updateCampaignRecord(
  campaignIdx: number,
  mutate: (record: MockCampaignRecord) => void,
) {
  campaignMockDb.update((db) => {
    const record = db.campaigns.find(
      (item) => item.campaignIdx === campaignIdx,
    );
    if (record) mutate(record);
  });
}

/** 지금 쓸 수 있는 브랜드(삭제 표시 안 됨). 없으면 null. */
export function findActiveBrand(brandIdx: number) {
  return (
    mockBrandDb
      .get()
      .brands.find(
        (brand) => brand.brandIdx === brandIdx && !brand.isDeleted,
      ) ?? null
  );
}

/** 브랜드를 이어 붙임. 결제 전 캠페인은 지운 브랜드를 비우고, 결제한 캠페인은 그대로 보임(A-6.3). */
function resolveBrand(record: MockCampaignRecord) {
  const { brandIdx } = record.info;
  if (brandIdx === null) return null;
  const brand = mockBrandDb
    .get()
    .brands.find((item) => item.brandIdx === brandIdx);
  if (!brand) return null;
  if (brand.isDeleted && record.payment === null) return null;
  return brand;
}

function hasAnyValue(...values: unknown[]) {
  return values.some((value) => value !== null && value !== "");
}

export function toDetailResponse(
  record: MockCampaignRecord,
): CampaignDetailResponse {
  const brand = resolveBrand(record);
  const { product } = record;
  return {
    campaignIdx: record.campaignIdx,
    serviceType: record.serviceType,
    productType: record.productType,
    status: record.status,
    demo: record.demo,
    demoCompleted: record.demoCompleted,
    rejectReason: record.rejectReason,
    info: {
      ...record.info,
      brandIdx: brand ? brand.brandIdx : null,
      campaignCode: record.campaignCode,
      brandName: brand?.name ?? null,
      brandLogoUrl: brand?.imageUrl ?? null,
    },
    product: {
      ...product,
      returnRequired: hasAnyValue(
        product.returnAddress,
        product.returnShippingFee,
        product.returnContact,
      ),
      rental: hasAnyValue(
        product.rentalReturnAddress,
        product.rentalReturnShippingFee,
        product.rentalReturnContact,
      ),
    },
    influencer: record.influencer,
    addOns: record.addOns,
    intro: record.intro,
    conditions: record.conditions,
    policy: record.policy,
    payment: record.payment,
  };
}

export function toListItem(record: MockCampaignRecord): CampaignListItem {
  return {
    campaignIdx: record.campaignIdx,
    campaignCode: record.campaignCode,
    serviceType: record.serviceType,
    productType: record.productType,
    status: record.status,
    name: record.info.name,
    brandName: resolveBrand(record)?.name ?? null,
    productName: record.product.productName,
    thumbnailUrl: record.intro.mainImage?.url ?? null,
    startDate: record.info.startDate,
    endDate: record.info.endDate,
    demo: record.demo,
    demoCompleted: record.demoCompleted,
    campaignType: record.info.campaignType,
    platform: record.influencer.platform,
    createdDate: record.createdDate,
  };
}
