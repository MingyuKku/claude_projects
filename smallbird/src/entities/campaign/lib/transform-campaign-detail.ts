import {
  CAMPAIGN_PRODUCT_TYPES,
  CAMPAIGN_SERVICE_TYPES,
  toCampaignStage,
} from "../model/codes";
import { createEmptyDraft } from "../model/draft";
import {
  CAMPAIGN_ADD_ONS,
  CAMPAIGN_MEDIA_TYPES,
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_TYPES,
  filterKnownCodes,
  CREATOR_AGE_GROUPS,
  CREATOR_GENDERS,
  POSTING_TOPICS,
  toKnownCode,
} from "../model/input-codes";

import type {
  CampaignAddressResponse,
  CampaignDetailResponse,
} from "../model/detail-schema";
import type { CampaignDetail } from "../model/detail-types";
import type { CampaignAddress, CampaignMedia } from "../model/draft";

function toAddress(
  address: CampaignAddressResponse | null,
): CampaignAddress | null {
  if (!address) return null;
  return {
    zonecode: address.zonecode,
    address: address.address,
    detail: address.detail ?? "",
  };
}

function toMedia(
  media: CampaignDetailResponse["intro"]["detailMedia"][number],
): CampaignMedia {
  return {
    attachmentIdx: media.attachmentIdx,
    url: media.url,
    // 서버는 IMAGE·VIDEO만 줌. 모르는 값이면 재생 아이콘 없이 이미지로 보임.
    mediaType: toKnownCode(CAMPAIGN_MEDIA_TYPES, media.mediaType) ?? "IMAGE",
  };
}

/** 상세 조회 응답을 화면 모델로 바꿈. 모르는 선택지 코드는 선택하지 않은 것으로 봄. */
export function transformCampaignDetail(
  response: CampaignDetailResponse,
): CampaignDetail {
  const { info, product, influencer, intro, conditions } = response;
  const emptyDraft = createEmptyDraft();

  return {
    campaignIdx: response.campaignIdx,
    campaignCode: info.campaignCode,
    serviceType: toKnownCode(CAMPAIGN_SERVICE_TYPES, response.serviceType),
    productType: toKnownCode(CAMPAIGN_PRODUCT_TYPES, response.productType),
    stage: toCampaignStage(response.status),
    rawStatus: response.status,
    isDemo: response.demo,
    isDemoCompleted: response.demoCompleted,
    rejectReason: response.rejectReason || null,
    brand: info.brandName
      ? { name: info.brandName, logoUrl: info.brandLogoUrl }
      : null,
    rawCampaignType: info.campaignType,
    endDate: info.endDate,
    draft: {
      info: {
        name: info.name ?? "",
        brandIdx: info.brandIdx,
        campaignType: toKnownCode(CAMPAIGN_TYPES, info.campaignType),
        startDate: info.startDate,
      },
      product: {
        productName: product.productName ?? "",
        quantityPerCreator: product.quantityPerInfluencer,
        productPrice: product.productPrice,
        returnRequired: product.returnRequired,
        returnAddress: toAddress(product.returnAddress),
        returnShippingFee: product.returnShippingFee,
        returnContact: product.returnContact ?? "",
        rental: product.rental,
        rentalReturnAddress: toAddress(product.rentalReturnAddress),
        rentalReturnShippingFee: product.rentalReturnShippingFee,
        rentalReturnContact: product.rentalReturnContact ?? "",
        storeName: product.storeName ?? "",
        storeAddress: toAddress(product.storeAddress),
        visitCouponCode: product.visitCouponCode ?? "",
        visitBenefit: product.visitBenefit ?? "",
      },
      creator: {
        platform: toKnownCode(CAMPAIGN_PLATFORMS, influencer.platform),
        gender: toKnownCode(CREATOR_GENDERS, influencer.gender),
        ageGroups: filterKnownCodes(CREATOR_AGE_GROUPS, influencer.ageGroups),
        topics: filterKnownCodes(POSTING_TOPICS, influencer.topics),
      },
      addOns: filterKnownCodes(CAMPAIGN_ADD_ONS, response.addOns),
      intro: {
        mainImage: intro.mainImage ? toMedia(intro.mainImage) : null,
        detailMedia: intro.detailMedia.map(toMedia),
        description: intro.description ?? "",
        notice: intro.notice ?? "",
        titleHashtags: intro.titleHashtags,
        contentHashtags: intro.contentHashtags,
      },
      conditions: {
        headcount: conditions.headcount,
        rewardPerCreator: conditions.rewardPerInfluencer,
        postingPeriodMonths: conditions.postingPeriodMonths,
        secondaryCopyright: conditions.secondaryCopyright,
      },
      policy: response.policy?.agreements ?? emptyDraft.policy,
    },
    payment: response.payment ?? null,
  };
}
