import { z } from "zod";

import { flag, list, nullable } from "./schema-helpers";

// 캠페인 생성(A-1)·상세 조회(A-3) 응답. 코드는 모르는 값도 읽도록 문자열로 받고 트랜스포머가 거름.
// "구현 예정"·"프론트 요청" 필드(rejectReason·policy·payment)는 아직 실제 응답에 없을 수 있어 nullish로 받음.

export const campaignCreatedSchema = z.object({
  campaignIdx: z.number().int(),
  campaignCode: z.string(),
});
export type CampaignCreatedResponse = z.infer<typeof campaignCreatedSchema>;

/** `{zonecode, address, detail}`. 우편번호는 5자리 문자열. */
export const campaignAddressSchema = z.object({
  zonecode: z.string(),
  address: z.string(),
  detail: z.string().nullish(),
});
export type CampaignAddressResponse = z.infer<typeof campaignAddressSchema>;

/** 소개서 파일. v2에서 만든 영상 주소만 있는 항목은 `attachmentIdx`가 null. */
export const campaignMediaSchema = z.object({
  attachmentIdx: nullable(z.number().int()),
  url: z.string(),
  mediaType: z.string(),
});

export const campaignDetailSchema = z.object({
  campaignIdx: z.number().int(),
  serviceType: nullable(z.string()),
  productType: nullable(z.string()),
  status: z.string(),
  demo: flag(),
  demoCompleted: flag(),
  /** 반려 사유(캠페인당 하나). `REJECTED`일 때만 값이 있음. */
  rejectReason: z.string().nullish(),
  info: z.object({
    campaignCode: z.string(),
    name: nullable(z.string()),
    brandIdx: nullable(z.number().int()),
    brandName: nullable(z.string()),
    brandLogoUrl: nullable(z.string()),
    campaignType: nullable(z.string()),
    startDate: nullable(z.string()),
    endDate: nullable(z.string()),
  }),
  product: z.object({
    productName: nullable(z.string()),
    quantityPerInfluencer: nullable(z.number().int()),
    productPrice: nullable(z.number().int()),
    returnRequired: flag(),
    returnAddress: nullable(campaignAddressSchema),
    returnShippingFee: nullable(z.number().int()),
    returnContact: nullable(z.string()),
    rental: flag(),
    rentalReturnAddress: nullable(campaignAddressSchema),
    rentalReturnShippingFee: nullable(z.number().int()),
    rentalReturnContact: nullable(z.string()),
    storeName: nullable(z.string()),
    storeAddress: nullable(campaignAddressSchema),
    visitCouponCode: nullable(z.string()),
    visitBenefit: nullable(z.string()),
  }),
  influencer: z.object({
    platform: nullable(z.string()),
    gender: nullable(z.string()),
    ageGroups: list(z.string()),
    topics: list(z.string()),
  }),
  /** 고른 부가서비스 코드(저장한 순서). */
  addOns: list(z.string()),
  intro: z.object({
    mainImage: nullable(campaignMediaSchema),
    detailMedia: list(campaignMediaSchema),
    description: nullable(z.string()),
    notice: nullable(z.string()),
    titleHashtags: list(z.string()),
    contentHashtags: list(z.string()),
  }),
  conditions: z.object({
    headcount: nullable(z.number().int()),
    rewardPerInfluencer: nullable(z.number().int()),
    postingPeriodMonths: nullable(z.number().int()),
    secondaryCopyright: nullable(z.boolean()),
  }),
  /** 7단계 정책 동의(A-5.7 구현 예정). */
  policy: z
    .object({
      agreements: z.object({
        service: flag(),
        privacy: flag(),
        operation: flag(),
        reward: flag(),
      }),
    })
    .nullish(),
  /** 결제 정보(프론트 요청). 결제 전이면 null. */
  payment: z
    .object({ paidAmount: z.number().int(), paidAt: z.string() })
    .nullish(),
});
export type CampaignDetailResponse = z.infer<typeof campaignDetailSchema>;

/** 1단계 저장(A-5.1) 응답. 다른 단계 저장은 본문 없음. */
export const campaignInfoSavedSchema = z.object({
  endDate: nullable(z.string()),
});

/** `balance`는 결제 뒤 잔액(목은 잔액 API를 바꿀 수 없어 0, 화면은 잔액을 다시 읽음). */
export const campaignPaidSchema = z.object({
  status: z.string(),
  paidAmount: z.number().int(),
  paidAt: z.string(),
  balance: z.number().int(),
});

/** `INCOMPLETE_DRAFT`이면 빈 단계의 경로 이름(`info` · `product` …)이 `missingSteps`로 옴. */
export const campaignPaymentErrorSchema = z.object({
  reason: z.string(),
  missingSteps: z.array(z.string()).optional(),
});

export const campaignApprovalCanceledSchema = z.object({
  status: z.string(),
  refundedAmount: z.number().int(),
  balance: z.number().int(),
});

export const campaignReapprovalRequestedSchema = z.object({
  status: z.string(),
});
