import {
  POSTING_GUIDE_METHODS,
  POSTING_GUIDE_STATUSES,
} from "../model/posting-guide";

import type {
  PostingGuide,
  PostingGuideBasicCondition,
  PostingGuidePayment,
  PostingGuidePreview,
} from "../model/posting-guide";
import type {
  PostingGuidePaymentResponse,
  PostingGuidePreviewResponse,
  PostingGuideResponse,
} from "../model/posting-guide-schema";

function pick<T extends string>(codes: readonly T[], value: string | null) {
  return codes.find((code) => code === value) ?? null;
}

export function transformPostingGuide(
  response: PostingGuideResponse,
): PostingGuide {
  return {
    method: pick(POSTING_GUIDE_METHODS, response.creationMethod),
    status: pick(POSTING_GUIDE_STATUSES, response.status),
    basicCondition: {
      minPhotoCount: response.minPhotoCount,
      minVideoCount: response.minVideoCount,
      requiredKeywords: response.requiredKeywords,
      requiredHashtags: response.requiredHashtags,
      notice: response.notice ?? "",
      referenceUrls: response.referenceUrls,
      photoType: response.photoType,
      videoType: response.videoType,
    },
    contentGuide: response.contentGuide ?? "",
    needsAttention: response.needsAttention,
  };
}

/** 기본 조건 저장 요청. 포스팅 수는 1회 고정(REQ-14-0018, 시안 11/19 입력 삭제)이라 1을 보냄. */
export function toBasicConditionRequest(condition: PostingGuideBasicCondition) {
  return {
    postingCount: 1,
    minPhotoCount: condition.minPhotoCount,
    minVideoCount: condition.minVideoCount,
    requiredKeywords: condition.requiredKeywords,
    requiredHashtags: condition.requiredHashtags,
    notice: condition.notice.trim() || null,
    referenceUrls: condition.referenceUrls,
    photoType: condition.photoType,
    videoType: condition.videoType,
  };
}

/** 미리보기. 진행 기간 "yyyy.MM.dd~yyyy.MM.dd"는 시안처럼 " - "로 잇는다. */
export function transformPostingGuidePreview(
  response: PostingGuidePreviewResponse,
): PostingGuidePreview {
  return {
    campaignName: response.campaignName,
    campaignType: response.campaignType,
    period: response.progressPeriod?.split("~").join(" - ") ?? null,
    campaignCode: response.campaignCode,
    brandName: response.brandName,
    brandImageUrl: response.brandImageUrl,
    guide: transformPostingGuide(response.guide),
  };
}

export function transformPostingGuidePayment(
  response: PostingGuidePaymentResponse,
): PostingGuidePayment {
  return {
    cost: response.cost,
    balance: response.balance,
    shortfallAmount: response.shortfallAmount,
    isPaid: response.alreadyPaid,
  };
}
