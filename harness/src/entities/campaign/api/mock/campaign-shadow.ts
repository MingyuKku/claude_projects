import { ApiError } from "@/shared/api";

import { assertEditable, campaignMockDb } from "./campaign-db";
import { toDateTime } from "./campaign-record";

import type { CampaignDetailResponse } from "../../model/detail-schema";
import type { CampaignListItem } from "../../model/schema";
import type { MockCampaignRecord } from "./campaign-record";

// 서버 연동 모드에서 서버에 아직 없는 기능(정책 동의 저장·결제·승인 취소·재승인·데모 전환)을 목으로 흉내 내려고 서버 캠페인의
// 그림자(shadow)를 같은 번호로 목 저장소에 둠. 입력값은 서버 응답으로 늘 다시 채우고, 서버에 없는 상태(상태·데모·반려 사유·
// 정책 동의·결제)만 그림자가 가진 값으로 덮어씀. 개발 서버에서만 쓰고 배포 빌드에는 들어가지 않음.

function findShadow(campaignIdx: number) {
  return (
    campaignMockDb
      .get()
      .campaigns.find((record) => record.campaignIdx === campaignIdx) ?? null
  );
}

function toShadowInputs(response: CampaignDetailResponse) {
  const { info, product } = response;
  return {
    campaignCode: info.campaignCode,
    serviceType: response.serviceType ?? "",
    productType: response.productType ?? "",
    info: {
      name: info.name,
      brandIdx: info.brandIdx,
      campaignType: info.campaignType,
      startDate: info.startDate,
      endDate: info.endDate,
    },
    // 회수·대여 여부는 칸 값으로 계산하므로 저장하지 않음.
    product: {
      productName: product.productName,
      quantityPerInfluencer: product.quantityPerInfluencer,
      productPrice: product.productPrice,
      returnAddress: product.returnAddress,
      returnShippingFee: product.returnShippingFee,
      returnContact: product.returnContact,
      rentalReturnAddress: product.rentalReturnAddress,
      rentalReturnShippingFee: product.rentalReturnShippingFee,
      rentalReturnContact: product.rentalReturnContact,
      storeName: product.storeName,
      storeAddress: product.storeAddress,
      visitCouponCode: product.visitCouponCode,
      visitBenefit: product.visitBenefit,
    },
    influencer: response.influencer,
    addOns: response.addOns,
    intro: response.intro,
    conditions: response.conditions,
  };
}

/** 서버 캠페인을 그림자에 맞춤. 없으면 서버 상태로 새로 만들고, 있으면 입력값만 서버 값으로 갱신함. */
export function syncShadow(response: CampaignDetailResponse) {
  const inputs = toShadowInputs(response);
  campaignMockDb.update((db) => {
    const existing = db.campaigns.find(
      (record) => record.campaignIdx === response.campaignIdx,
    );
    if (existing) {
      Object.assign(existing, inputs);
      return;
    }
    const created: MockCampaignRecord = {
      ...inputs,
      campaignIdx: response.campaignIdx,
      status: response.status,
      demo: response.demo,
      demoCompleted: response.demoCompleted,
      rejectReason: response.rejectReason ?? null,
      createdDate: toDateTime(new Date()),
      policy: response.policy ?? null,
      payment: response.payment ?? null,
    };
    db.campaigns.push(created);
  });
}

/** 서버 응답에 그림자가 가진 상태를 덮어씀. 그림자가 없으면 그대로. */
export function applyShadowToDetail(
  response: CampaignDetailResponse,
): CampaignDetailResponse {
  const shadow = findShadow(response.campaignIdx);
  if (!shadow) return response;
  return {
    ...response,
    status: shadow.status,
    demo: shadow.demo,
    demoCompleted: shadow.demoCompleted,
    rejectReason: shadow.rejectReason,
    policy: shadow.policy,
    payment: shadow.payment,
  };
}

/** 서버가 작성 완료로 바꾼 데모를 그림자에도 반영함. 안 하면 그림자의 옛 값이 서버 값을 덮어씀. */
export function markShadowDemoCompleted(campaignIdx: number) {
  campaignMockDb.update((db) => {
    const shadow = db.campaigns.find(
      (record) => record.campaignIdx === campaignIdx,
    );
    if (shadow) shadow.demoCompleted = true;
  });
}

/** 서버가 실제 캠페인으로 전환한 데모를 그림자에도 반영하고, 전환 때 비우는 7단계 동의도 비움. */
export function markShadowDemoConverted(campaignIdx: number) {
  campaignMockDb.update((db) => {
    const shadow = db.campaigns.find(
      (record) => record.campaignIdx === campaignIdx,
    );
    if (!shadow) return;
    shadow.demo = false;
    shadow.demoCompleted = false;
    shadow.policy = null;
  });
}

/** 목록에는 상태·데모만 덮어씀. */
export function applyShadowToList<T extends { list: CampaignListItem[] }>(
  response: T,
): T {
  const { campaigns } = campaignMockDb.get();
  const list = response.list.map((item) => {
    const shadow = campaigns.find(
      (record) => record.campaignIdx === item.campaignIdx,
    );
    if (!shadow) return item;
    return {
      ...item,
      status: shadow.status,
      demo: shadow.demo,
      demoCompleted: shadow.demoCompleted,
    };
  });
  return { ...response, list };
}

/** 그림자가 이미 수정할 수 없는 상태(결제·승인·작성 완료 데모)면 서버로 보내기 전에 막음. */
export function assertShadowEditable(campaignIdx: number) {
  const shadow = findShadow(campaignIdx);
  if (shadow) assertEditable(shadow);
}

/** 그림자가 이미 결제·승인으로 바뀐 캠페인이면 서버는 모르고 지워 버리므로 보내기 전에 막음. */
export function assertShadowDeletable(campaignIdx: number) {
  const shadow = findShadow(campaignIdx);
  if (shadow && shadow.status !== "DRAFT") {
    throw new ApiError(409, { reason: "NOT_DELETABLE" });
  }
}
