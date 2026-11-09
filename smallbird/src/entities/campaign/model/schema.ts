import { z } from "zod";

import {
  APPROVAL_STATUSES,
  CAMPAIGN_ADD_ONS,
  CAMPAIGN_AGE_GROUPS,
  CAMPAIGN_GENDERS,
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_PRODUCT_TYPES,
  CAMPAIGN_SECTIONS,
  CAMPAIGN_SERVICE_TYPES,
  CAMPAIGN_TOPICS,
  CAMPAIGN_TYPES,
  INTRO_MODES,
} from "./codes";

// 캠페인 등록 API 요구 명세(A-2 초안 객체, A-13 등록 내역)의 응답 모양. API가 없는 동안 목도 이 스키마로 검증하고, 경로·필드 이름은 백엔드와 맞추는 중이라 바뀔 수 있음.
// 초안은 서버 값과 폼 값의 모양이 같아 트랜스포머 없이 쓰고, 입력하지 않은 값은 `null`(목록은 `[]`)임.

/** 우편번호 · 기본 주소(Daum 우편번호에서 고름, 읽기 전용) · 상세 주소(직접 입력). */
export const addressSchema = z.object({
  zonecode: z.string(),
  address: z.string(),
  detail: z.string(),
});
export type CampaignAddress = z.infer<typeof addressSchema>;

/** 파일 업로드 응답(A-8)이자 초안에 저장되는 파일. 동영상은 길이를 보여 줌. */
export const campaignFileSchema = z.object({
  fileId: z.string(),
  url: z.string(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  durationSec: z.number().int().nullable(),
  thumbnailUrl: z.string().nullable().default(null),
});
export type CampaignFile = z.infer<typeof campaignFileSchema>;

const campaignInfoSchema = z.object({
  name: z.string().nullable(),
  campaignType: z.enum(CAMPAIGN_TYPES).nullable(),
  brandIdx: z.number().int().nullable(),
  /** 캠페인 희망 시작 일자(`yyyy-MM-dd`). */
  startDate: z.string().nullable(),
  /** 시작일 + 30일로 서버가 정하는 응답 전용 값. 저장할 때는 보내지 않음. */
  endDate: z.string().nullable(),
});

const productSchema = z.object({
  /** 제품발송형 협찬제품명 · 구매리뷰형 구매제품명. */
  productName: z.string().nullable(),
  quantityPerInfluencer: z.number().int().nullable(),
  /** 제품발송형 협찬제품 금액(제품 1개당 원). 모집형 리워드의 상한. */
  productPrice: z.number().int().nullable(),
  returnRequired: z.boolean().nullable(),
  returnAddress: addressSchema.nullable(),
  returnShippingFee: z.number().int().nullable(),
  returnContact: z.string().nullable(),
  rental: z.boolean().nullable(),
  rentalReturnAddress: addressSchema.nullable(),
  rentalReturnShippingFee: z.number().int().nullable(),
  rentalReturnContact: z.string().nullable(),
  storeName: z.string().nullable(),
  storeAddress: addressSchema.nullable(),
  visitCouponCode: z.string().nullable(),
  visitBenefit: z.string().nullable(),
  purchaseUrl: z.string().nullable(),
  purchaseUrlVerified: z.boolean().nullable(),
  /** 모집형 구매리뷰형 구매제품 금액(제품 1개당 원). 리워드의 상한. */
  purchasePrice: z.number().int().nullable(),
  purchaseGuide: z.string().nullable(),
});

const influencerSchema = z.object({
  platform: z.enum(CAMPAIGN_PLATFORMS).nullable(),
  gender: z.enum(CAMPAIGN_GENDERS).nullable(),
  ageGroups: z.array(z.enum(CAMPAIGN_AGE_GROUPS)),
  topics: z.array(z.enum(CAMPAIGN_TOPICS)),
});

/** 진행 중인 AI 생성 작업. 새로고침해도 이어서 기다리도록 초안에 남김. */
const aiJobSchema = z.object({
  jobId: z.string(),
  status: z.enum(["PENDING", "DONE", "FAILED"]),
});
export type CampaignAiJob = z.infer<typeof aiJobSchema>;

const introSchema = z.object({
  mode: z.enum(INTRO_MODES).nullable(),
  sourceUrl: z.string().nullable(),
  mainImage: campaignFileSchema.nullable(),
  media: z.array(campaignFileSchema),
  description: z.string().nullable(),
  notice: z.string().nullable(),
  hashtags: z.array(z.string()),
  aiJob: aiJobSchema.nullable(),
});

const conditionsSchema = z.object({
  /** 포스팅 유지기간(개월). 구매리뷰형은 `null`. */
  postingPeriodMonths: z.number().int().nullable(),
  secondaryCopyright: z.boolean().nullable(),
  /** 모집형 진행 인원 · 모집형 구매리뷰형 모집 인원. PICK형은 `null`. */
  headcount: z.number().int().nullable(),
  /** 인플루언서 1인당 리워드(원). 모집형 제품발송형·구매리뷰형에만 있음. */
  rewardPerInfluencer: z.number().int().nullable(),
});

const policySchema = z.object({
  agreements: z.object({
    service: z.boolean(),
    privacy: z.boolean(),
    operation: z.boolean(),
    reward: z.boolean(),
  }),
});

/** `GET /v3/campaign/{id}/draft`(A-2) 응답. 저장(A-3)은 이 모양에서 응답 전용 필드를 뺀 값을 보냄. */
export const campaignDraftSchema = z.object({
  campaignIdx: z.number().int(),
  campaignCode: z.string(),
  serviceType: z.enum(CAMPAIGN_SERVICE_TYPES),
  productType: z.enum(CAMPAIGN_PRODUCT_TYPES),
  status: z.enum(APPROVAL_STATUSES),
  /** 저장할 때마다 오르는 값. 두 탭의 덮어쓰기를 막는 데 씀. */
  version: z.number().int(),
  /** 사용자가 가 본 단계. 사이드바 완료·경고 표시는 이 목록과 초안 값으로 프론트가 정함. */
  visitedSteps: z.array(z.enum(CAMPAIGN_SECTIONS)),
  updatedAt: z.string(),
  campaignInfo: campaignInfoSchema,
  product: productSchema,
  influencer: influencerSchema,
  addOns: z.array(z.enum(CAMPAIGN_ADD_ONS)),
  intro: introSchema,
  conditions: conditionsSchema,
  policy: policySchema,
});
export type CampaignDraft = z.infer<typeof campaignDraftSchema>;

/** 등록 내역에 붙는 브랜드. `entities/brand`의 목록 항목과 같은 모양이지만 엔티티끼리 가져올 수 없어 따로 선언함. */
const detailBrandSchema = z.object({
  brandIdx: z.number().int(),
  nameKo: z.string(),
  nameEn: z.string(),
  imageUrl: z.string().nullable(),
});

/**
 * `GET /v3/campaign/{id}`(A-13) 응답: 초안 객체 + 등록 내역 전용 필드.
 * 반려 섹션과 부가서비스 단가의 코드는 서버가 늘릴 수 있어 좁히지 않고, 화면이 `isXxx` 가드로 알려진 값만 번역함.
 */
export const campaignDetailSchema = campaignDraftSchema.extend({
  brand: detailBrandSchema.nullable(),
  rejections: z.array(z.object({ section: z.string(), reason: z.string() })),
  /** 남은 재승인 횟수(최대 2회). */
  reapprovalRemaining: z.number().int(),
  payment: z
    .object({
      paidAmount: z.number().int(),
      paidAt: z.string(),
      method: z.string(),
    })
    .nullable(),
  addOnPrices: z.array(
    z.object({
      code: z.string(),
      unitPrice: z.number().int(),
      unit: z.enum(["FIXED", "PER_INFLUENCER"]),
    }),
  ),
  reviewedAt: z.string().nullable(),
});
export type CampaignDetail = z.infer<typeof campaignDetailSchema>;

/** 초안 저장(A-3) 본문: 초안에서 서버가 정하는 값(코드·유형·상태·저장 시각·종료일)을 뺀 것. */
export type CampaignDraftSaveBody = Omit<
  CampaignDraft,
  | "campaignIdx"
  | "campaignCode"
  | "serviceType"
  | "productType"
  | "status"
  | "updatedAt"
  | "campaignInfo"
> & {
  campaignInfo: Omit<CampaignDraft["campaignInfo"], "endDate">;
};

/** 초안 저장(A-3) 응답. `endDate`는 시작일이 바뀌었을 때 서버가 다시 계산한 종료일. */
export const campaignDraftSaveResultSchema = z.object({
  version: z.number().int(),
  updatedAt: z.string(),
  endDate: z.string().nullable(),
});
export type CampaignDraftSaveResult = z.infer<
  typeof campaignDraftSaveResultSchema
>;

/**
 * 이전 캠페인 검색(A-6) 응답 항목. 표시 전용이라 유형·플랫폼 코드는 좁히지 않고 화면이 `isXxx` 가드로 알려진 값만 번역함.
 * `createdDate`는 등록일 `yyyy-MM-dd HH:mm:ss`.
 */
export const previousCampaignSchema = z.object({
  campaignIdx: z.number().int(),
  name: z.string(),
  brandName: z.string().nullable(),
  campaignType: z.string().nullable(),
  platform: z.string().nullable(),
  createdDate: z.string(),
});
export type PreviousCampaign = z.infer<typeof previousCampaignSchema>;

/** 목록 응답 공통 모양(요구 명세 공통 규칙 7). */
export const previousCampaignPageSchema = z.object({
  list: z.array(previousCampaignSchema),
  count: z.number().int(),
  currentPage: z.number().int(),
  entrySize: z.number().int(),
});
export type PreviousCampaignPage = z.infer<typeof previousCampaignPageSchema>;

/** 결제(A-12) 응답. */
export const campaignPaymentResultSchema = z.object({
  status: z.enum(APPROVAL_STATUSES),
  paidAmount: z.number().int(),
  paidAt: z.string(),
  /** 결제 뒤 잔액. 화면은 잔액 API를 다시 읽어 헤더를 갱신함. */
  balance: z.number().int(),
});
export type CampaignPaymentResult = z.infer<typeof campaignPaymentResultSchema>;

/** 승인 요청 취소(A-14) 응답. */
export const campaignCancelResultSchema = z.object({
  status: z.enum(APPROVAL_STATUSES),
  refundedAmount: z.number().int(),
  balance: z.number().int(),
});
export type CampaignCancelResult = z.infer<typeof campaignCancelResultSchema>;

/** 재승인 요청(A-15) 응답. */
export const campaignReapprovalResultSchema = z.object({
  status: z.enum(APPROVAL_STATUSES),
  reapprovalRemaining: z.number().int(),
});
export type CampaignReapprovalResult = z.infer<
  typeof campaignReapprovalResultSchema
>;
