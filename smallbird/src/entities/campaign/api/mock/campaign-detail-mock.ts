import { ApiError } from "@/shared/api";
import { getMockFile } from "@/shared/lib";

import {
  CAMPAIGN_PRODUCT_TYPES,
  CAMPAIGN_SERVICE_TYPES,
} from "../../model/codes";
import {
  assertEditable,
  campaignMockDb,
  findActiveBrand,
  findCampaignRecord,
  toDetailResponse,
  updateCampaignRecord,
} from "./campaign-db";
import {
  createEmptyInputs,
  createEmptyRecord,
  toDateTime,
  toEndDate,
} from "./campaign-record";

import type { CampaignStepRequests } from "../../lib/to-step-request";
import type {
  CampaignProductType,
  CampaignServiceType,
} from "../../model/codes";
import type {
  CampaignCreatedResponse,
  CampaignDetailResponse,
} from "../../model/detail-schema";
import type { CampaignDraftStep } from "../../model/draft";
import type { MockCampaignRecord } from "./campaign-record";

// 캠페인 생성(A-1)·상세(A-3)·단계별 수정(A-5.x)·불러오기(A-8)의 목. 서버가 하는 검사(수정 가능 상태, 반려 중 잠금,
// 3단계 필수, 유형 변경 시 2~6단계 비움)를 흉내 냄.

const MAX_DETAIL_MEDIA = 5;

function invalidField(field: string) {
  return new ApiError(400, { reason: "INVALID_FIELD", field });
}

function lockedField(fields: string[]) {
  return new ApiError(409, { reason: "LOCKED_FIELD", fields });
}

export async function createCampaign(body: {
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  demo: boolean;
}): Promise<CampaignCreatedResponse> {
  if (!CAMPAIGN_SERVICE_TYPES.includes(body.serviceType)) {
    throw new ApiError(400, { reason: "INVALID_SERVICE_TYPE" });
  }
  if (!CAMPAIGN_PRODUCT_TYPES.includes(body.productType)) {
    throw new ApiError(400, { reason: "INVALID_PRODUCT_TYPE" });
  }
  let created: MockCampaignRecord | undefined;
  campaignMockDb.update((db) => {
    created = createEmptyRecord({
      campaignIdx: db.nextCampaignIdx,
      serviceType: body.serviceType,
      productType: body.productType,
      demo: body.demo,
      createdDate: toDateTime(new Date()),
    });
    db.nextCampaignIdx += 1;
    db.campaigns.push(created);
  });
  if (!created) throw new Error("mock campaign was not created");
  return {
    campaignIdx: created.campaignIdx,
    campaignCode: created.campaignCode,
  };
}

export async function getCampaignDetail(
  campaignIdx: number,
): Promise<CampaignDetailResponse> {
  return toDetailResponse(findCampaignRecord(campaignIdx));
}

/** 유형이 이미 있고 다른 값으로 바뀌면 2~6단계를 비움(A-5.1). 반려 중에는 유형을 바꿀 수 없음. */
async function saveInfo(
  record: MockCampaignRecord,
  body: CampaignStepRequests["info"],
) {
  if (body.brandIdx !== null && !findActiveBrand(body.brandIdx)) {
    throw new ApiError(400, { reason: "INVALID_BRAND" });
  }
  const isTypeChanged =
    record.info.campaignType !== null &&
    record.info.campaignType !== body.campaignType;
  if (isTypeChanged && record.status === "REJECTED") {
    throw lockedField(["campaignType"]);
  }
  const endDate = toEndDate(body.startDate);
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.info = { ...body, endDate };
    if (isTypeChanged) Object.assign(target, createEmptyInputs());
  });
  return { endDate };
}

async function saveProduct(
  record: MockCampaignRecord,
  body: CampaignStepRequests["product"],
) {
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.product = { ...body };
  });
}

/** 연령대·주제는 저장 때도 필수(A-5.3, Q-16). */
async function saveInfluencer(
  record: MockCampaignRecord,
  body: CampaignStepRequests["influencer"],
) {
  if (body.ageGroups.length === 0) throw invalidField("ageGroups");
  if (body.topics.length === 0) throw invalidField("topics");
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.influencer = { ...body };
  });
}

function isSameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

async function saveAddOns(
  record: MockCampaignRecord,
  body: CampaignStepRequests["addOns"],
) {
  const addOns = [...new Set(body.addOns)];
  if (record.status === "REJECTED" && !isSameSet(addOns, record.addOns)) {
    throw lockedField(["addOns"]);
  }
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.addOns = addOns;
  });
}

/** 번호로 파일을 찾음. 이미 붙어 있던 파일이면 그 주소를, 새로 올린 파일이면 목 보관소 주소를 씀. */
function resolveMedia(
  record: MockCampaignRecord,
  attachmentIdx: number | null,
) {
  const current = [record.intro.mainImage, ...record.intro.detailMedia].find(
    (media) => media !== null && media.attachmentIdx === attachmentIdx,
  );
  if (current) return current;
  const uploaded = attachmentIdx === null ? null : getMockFile(attachmentIdx);
  if (!uploaded) throw new ApiError(400, { reason: "INVALID_ATTACHMENT" });
  return {
    attachmentIdx: uploaded.attachmentIdx,
    url: uploaded.url,
    mediaType: uploaded.mediaType,
  };
}

async function saveIntro(
  record: MockCampaignRecord,
  body: CampaignStepRequests["intro"],
) {
  if (body.detailMedia.length > MAX_DETAIL_MEDIA) {
    throw invalidField("detailMedia");
  }
  const mainImage = body.mainImage
    ? resolveMedia(record, body.mainImage.attachmentIdx)
    : null;
  const detailMedia = body.detailMedia.map((media) =>
    resolveMedia(record, media.attachmentIdx),
  );
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.intro = { ...body, mainImage, detailMedia };
  });
}

async function saveConditions(
  record: MockCampaignRecord,
  body: CampaignStepRequests["conditions"],
) {
  if (record.status === "REJECTED") {
    const lockedFields = (["headcount", "rewardPerInfluencer"] as const).filter(
      (field) => body[field] !== record.conditions[field],
    );
    if (lockedFields.length > 0) throw lockedField(lockedFields);
  }
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.conditions = { ...body };
  });
}

/** 반려 중에는 정책 동의도 잠금(프론트 요청, A-5). */
async function savePolicy(
  record: MockCampaignRecord,
  body: CampaignStepRequests["policy"],
) {
  if (record.status === "REJECTED") throw lockedField(["agreements"]);
  updateCampaignRecord(record.campaignIdx, (target) => {
    target.policy = { agreements: { ...body.agreements } };
  });
}

const STEP_SAVERS: {
  [S in CampaignDraftStep]: (
    record: MockCampaignRecord,
    body: CampaignStepRequests[S],
  ) => Promise<unknown>;
} = {
  info: saveInfo,
  product: saveProduct,
  influencer: saveInfluencer,
  addOns: saveAddOns,
  intro: saveIntro,
  conditions: saveConditions,
  policy: savePolicy,
};

/** 단계별 수정(A-5.x). 1단계만 `{endDate}`를 돌려주고 나머지는 본문 없음. */
export async function saveCampaignStep<S extends CampaignDraftStep>(
  campaignIdx: number,
  step: S,
  body: CampaignStepRequests[S],
): Promise<unknown> {
  const record = findCampaignRecord(campaignIdx);
  assertEditable(record);
  return STEP_SAVERS[step](record, body);
}

/** 이전 캠페인 불러오기(A-8). 1~6단계를 복사하고 코드·상태·정책 동의·결제는 지금 것을 유지함. */
export async function copyCampaign(
  campaignIdx: number,
  sourceCampaignIdx: number,
): Promise<void> {
  const target = findCampaignRecord(campaignIdx);
  const source = campaignMockDb
    .get()
    .campaigns.find((item) => item.campaignIdx === sourceCampaignIdx);
  if (!source || source.campaignIdx === campaignIdx) {
    throw new ApiError(404, { reason: "SOURCE_NOT_FOUND" });
  }
  if (source.serviceType !== target.serviceType) {
    throw new ApiError(400, { reason: "SERVICE_TYPE_MISMATCH" });
  }
  assertEditable(target);
  const brandIdx =
    source.info.brandIdx !== null && findActiveBrand(source.info.brandIdx)
      ? source.info.brandIdx
      : null;
  updateCampaignRecord(campaignIdx, (record) => {
    record.info = {
      ...source.info,
      brandIdx,
      endDate: toEndDate(source.info.startDate),
    };
    record.product = structuredClone(source.product);
    record.influencer = structuredClone(source.influencer);
    record.addOns = [...source.addOns];
    record.intro = structuredClone(source.intro);
    record.conditions = { ...source.conditions };
  });
}
