import { omit } from "radash";

import { findMockBrand } from "./brand-snapshot";
import { campaignMockDb, createEmptyCampaign } from "./campaign-mock-db";
import {
  calculateEndDate,
  fail,
  now,
  requireCampaign,
  withDerivedFields,
} from "./campaign-mock-helpers";

import type {
  CampaignProductType,
  CampaignServiceType,
} from "../../model/codes";
import type {
  CampaignDetail,
  CampaignDraft,
  CampaignDraftSaveBody,
  CampaignDraftSaveResult,
  PreviousCampaign,
  PreviousCampaignPage,
} from "../../model/schema";

/** A-1 초안 생성. */
export async function createDraft(input: {
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
}): Promise<CampaignDraft> {
  let created: CampaignDetail | undefined;
  campaignMockDb.update((db) => {
    const campaignIdx = db.nextCampaignIdx;
    db.nextCampaignIdx += 1;
    created = createEmptyCampaign({ campaignIdx, ...input, now: now() });
    db.campaigns[campaignIdx] = created;
  });
  if (!created) throw new Error("mock campaign was not created");
  return withDerivedFields(created);
}

/** A-2 초안 조회. 결제가 끝난 캠페인도 조회됨. */
export async function getDraft(campaignIdx: number): Promise<CampaignDraft> {
  return withDerivedFields(requireCampaign(campaignIdx));
}

/** A-13 등록 내역 조회. */
export async function getCampaign(
  campaignIdx: number,
): Promise<CampaignDetail> {
  return withDerivedFields(requireCampaign(campaignIdx));
}

/** 반려 중에 바꿀 수 없는 값(금액에 영향): 부가서비스·인원·리워드. */
function changesLockedFields(
  current: CampaignDraft,
  body: CampaignDraftSaveBody,
) {
  return (
    JSON.stringify(current.addOns) !== JSON.stringify(body.addOns) ||
    current.conditions.headcount !== body.conditions.headcount ||
    current.conditions.rewardPerInfluencer !==
      body.conditions.rewardPerInfluencer
  );
}

/** A-3 초안 저장(전체 덮어쓰기). 저장할 때는 필수·범위를 검사하지 않음(Q-3). */
export async function saveDraft(
  campaignIdx: number,
  body: CampaignDraftSaveBody & { version: number },
): Promise<CampaignDraftSaveResult> {
  const current = requireCampaign(campaignIdx);
  if (current.status !== "DRAFT" && current.status !== "REJECTED") {
    fail(409, "NOT_EDITABLE");
  }
  if (current.version !== body.version) fail(409, "VERSION_CONFLICT");
  if (current.status === "REJECTED" && changesLockedFields(current, body)) {
    fail(409, "LOCKED_FIELD");
  }

  const saved = { version: current.version + 1, updatedAt: now() };
  campaignMockDb.update((db) => {
    const target = db.campaigns[campaignIdx];
    if (!target) return;
    Object.assign(target, omit(body, ["version"]), saved);
    target.campaignInfo = { ...body.campaignInfo, endDate: null };
  });
  return {
    ...saved,
    endDate: calculateEndDate(body.campaignInfo.startDate),
  };
}

/** 이전 캠페인 불러오기 목록에 보일 캠페인: 이름을 정한 것만(입력이 비어 있는 등록 중 캠페인은 뺌). */
function toPreviousCampaign(campaign: CampaignDetail): PreviousCampaign | null {
  const { name } = campaign.campaignInfo;
  if (!name) return null;
  return {
    campaignIdx: campaign.campaignIdx,
    name,
    brandName: findMockBrand(campaign.campaignInfo.brandIdx)?.nameKo ?? null,
    campaignType: campaign.campaignInfo.campaignType,
    platform: campaign.influencer.platform,
    createdDate: campaign.updatedAt,
  };
}

/** A-6 이전 캠페인 검색. 같은 서비스 유형만, 캠페인명·브랜드명 부분 일치, 등록일 최신순. */
export async function searchPrevious(input: {
  serviceType: CampaignServiceType;
  keyword: string | null;
  excludeCampaignIdx: number;
  page: number;
  entrySize: number;
}): Promise<PreviousCampaignPage> {
  const keyword = input.keyword?.trim().toLowerCase() ?? "";
  const matched = Object.values(campaignMockDb.get().campaigns)
    .filter(
      (campaign) =>
        campaign.serviceType === input.serviceType &&
        campaign.campaignIdx !== input.excludeCampaignIdx,
    )
    .map(toPreviousCampaign)
    .filter((item) => item !== null)
    .filter(
      (item) =>
        keyword === "" ||
        item.name.toLowerCase().includes(keyword) ||
        (item.brandName?.toLowerCase().includes(keyword) ?? false),
    )
    .sort(
      (a, b) =>
        b.createdDate.localeCompare(a.createdDate) ||
        b.campaignIdx - a.campaignIdx,
    );
  const start = (input.page - 1) * input.entrySize;
  return {
    list: matched.slice(start, start + input.entrySize),
    count: matched.length,
    currentPage: input.page,
    entrySize: input.entrySize,
  };
}

/**
 * A-7 이전 캠페인 불러오기. 고른 캠페인의 1~6단계 입력값을 지금 초안에 복사하고 캠페인 코드는 유지함.
 * 약관 동의(7단계)·결제·가 본 단계·진행 중인 AI 작업은 복사하지 않음.
 */
export async function copyDraftFrom(
  campaignIdx: number,
  sourceCampaignIdx: number,
): Promise<CampaignDraft> {
  const current = requireCampaign(campaignIdx);
  const source = campaignMockDb.get().campaigns[sourceCampaignIdx];
  if (!source) fail(404, "SOURCE_NOT_FOUND");
  if (source.serviceType !== current.serviceType) {
    fail(400, "SERVICE_TYPE_MISMATCH");
  }
  if (current.status !== "DRAFT" && current.status !== "REJECTED") {
    fail(409, "NOT_EDITABLE");
  }

  campaignMockDb.update((db) => {
    const target = db.campaigns[campaignIdx];
    if (!target) return;
    target.campaignInfo = { ...source.campaignInfo, endDate: null };
    target.product = source.product;
    target.influencer = source.influencer;
    target.addOns = source.addOns;
    target.intro = { ...source.intro, aiJob: null };
    target.conditions = source.conditions;
    target.policy = {
      agreements: {
        service: false,
        privacy: false,
        operation: false,
        reward: false,
      },
    };
    target.visitedSteps = [];
    target.version = current.version + 1;
    target.updatedAt = now();
  });
  return withDerivedFields(requireCampaign(campaignIdx));
}

export * from "./approval-mock-api";
