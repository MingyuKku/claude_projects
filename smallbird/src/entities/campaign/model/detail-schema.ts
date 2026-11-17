import { z } from "zod";

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
  attachmentIdx: z.number().int().nullable(),
  url: z.string(),
  mediaType: z.string(),
});

export const campaignDetailSchema = z.object({
  campaignIdx: z.number().int(),
  serviceType: z.string().nullable(),
  productType: z.string().nullable(),
  status: z.string(),
  demo: z.boolean(),
  demoCompleted: z.boolean(),
  /** 반려 사유(캠페인당 하나). `REJECTED`일 때만 값이 있음. */
  rejectReason: z.string().nullish(),
  info: z.object({
    campaignCode: z.string(),
    name: z.string().nullable(),
    brandIdx: z.number().int().nullable(),
    brandName: z.string().nullable(),
    brandLogoUrl: z.string().nullable(),
    campaignType: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
  }),
  product: z.object({
    productName: z.string().nullable(),
    quantityPerInfluencer: z.number().int().nullable(),
    productPrice: z.number().int().nullable(),
    returnRequired: z.boolean(),
    returnAddress: campaignAddressSchema.nullable(),
    returnShippingFee: z.number().int().nullable(),
    returnContact: z.string().nullable(),
    rental: z.boolean(),
    rentalReturnAddress: campaignAddressSchema.nullable(),
    rentalReturnShippingFee: z.number().int().nullable(),
    rentalReturnContact: z.string().nullable(),
    storeName: z.string().nullable(),
    storeAddress: campaignAddressSchema.nullable(),
    visitCouponCode: z.string().nullable(),
    visitBenefit: z.string().nullable(),
  }),
  influencer: z.object({
    platform: z.string().nullable(),
    gender: z.string().nullable(),
    ageGroups: z.array(z.string()),
    topics: z.array(z.string()),
  }),
  /** 고른 부가서비스 코드(저장한 순서). */
  addOns: z.array(z.string()),
  intro: z.object({
    mainImage: campaignMediaSchema.nullable(),
    detailMedia: z.array(campaignMediaSchema),
    description: z.string().nullable(),
    notice: z.string().nullable(),
    titleHashtags: z.array(z.string()),
    contentHashtags: z.array(z.string()),
  }),
  conditions: z.object({
    headcount: z.number().int().nullable(),
    rewardPerInfluencer: z.number().int().nullable(),
    postingPeriodMonths: z.number().int().nullable(),
    secondaryCopyright: z.boolean().nullable(),
  }),
  /** 7단계 정책 동의(A-5.7 구현 예정). */
  policy: z
    .object({
      agreements: z.object({
        service: z.boolean(),
        privacy: z.boolean(),
        operation: z.boolean(),
        reward: z.boolean(),
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
  endDate: z.string().nullable(),
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
