import type {
  CampaignAddOn,
  CampaignMediaType,
  CampaignPlatform,
  CampaignType,
  InfluencerAgeGroup,
  InfluencerGender,
  PostingTopic,
} from "./input-codes";

// 등록 마법사가 입력받는 값. 단계 키는 단계별 수정 API(A-5.x)와 상세 조회(A-3)의 객체 이름과 같음.
// 글자 칸은 빈 문자열, 숫자·선택 칸은 null이 "입력 전"이고, 저장 요청을 만들 때 빈 값은 null로 바꿈.

export const CAMPAIGN_DRAFT_STEPS = [
  "info",
  "product",
  "influencer",
  "addOns",
  "intro",
  "conditions",
  "policy",
] as const;
export type CampaignDraftStep = (typeof CAMPAIGN_DRAFT_STEPS)[number];

export interface CampaignAddress {
  /** 우편번호 5자리. */
  zonecode: string;
  address: string;
  detail: string;
}

export interface CampaignMedia {
  /** v2에서 만든 영상 주소만 있는 항목은 null(저장 요청에 보낼 수 없음). */
  attachmentIdx: number | null;
  /** 올린 파일의 주소. 아직 올리지 않은 파일(`file`)은 미리보기용 `blob:` 주소. */
  url: string;
  mediaType: CampaignMediaType;
  /** 고르기만 하고 아직 서버에 올리지 않은 파일. 있으면 5단계를 저장할 때 올리고 번호·주소로 바꿈. */
  file?: File;
}

export interface CampaignInfoDraft {
  name: string;
  brandIdx: number | null;
  campaignType: CampaignType | null;
  /** 희망 시작일 `yyyy-MM-dd`. 종료일은 서버가 정함. */
  startDate: string | null;
}

export interface CampaignProductDraft {
  productName: string;
  quantityPerInfluencer: number | null;
  productPrice: number | null;
  /** 반품 회수 여부. 기본 "회수 안함". */
  returnRequired: boolean;
  returnAddress: CampaignAddress | null;
  returnShippingFee: number | null;
  returnContact: string;
  /** 대여 상품 여부. 기본 "일반 상품". */
  rental: boolean;
  rentalReturnAddress: CampaignAddress | null;
  rentalReturnShippingFee: number | null;
  rentalReturnContact: string;
  storeName: string;
  storeAddress: CampaignAddress | null;
  visitCouponCode: string;
  visitBenefit: string;
}

export interface CampaignInfluencerDraft {
  platform: CampaignPlatform | null;
  gender: InfluencerGender | null;
  ageGroups: InfluencerAgeGroup[];
  topics: PostingTopic[];
}

export interface CampaignIntroDraft {
  mainImage: CampaignMedia | null;
  detailMedia: CampaignMedia[];
  description: string;
  notice: string;
  titleHashtags: string[];
  contentHashtags: string[];
}

export interface CampaignConditionsDraft {
  /** 모집형 진행 인원. PICK형은 null. */
  headcount: number | null;
  /** 모집형 제품발송형 1인당 리워드. 그 밖은 null. */
  rewardPerInfluencer: number | null;
  postingPeriodMonths: number | null;
  secondaryCopyright: boolean | null;
}

export interface CampaignPolicyAgreements {
  service: boolean;
  privacy: boolean;
  operation: boolean;
  reward: boolean;
}

export interface CampaignDraft {
  info: CampaignInfoDraft;
  product: CampaignProductDraft;
  influencer: CampaignInfluencerDraft;
  addOns: CampaignAddOn[];
  intro: CampaignIntroDraft;
  conditions: CampaignConditionsDraft;
  policy: CampaignPolicyAgreements;
}

export function createEmptyProductDraft(): CampaignProductDraft {
  return {
    productName: "",
    quantityPerInfluencer: null,
    productPrice: null,
    returnRequired: false,
    returnAddress: null,
    returnShippingFee: null,
    returnContact: "",
    rental: false,
    rentalReturnAddress: null,
    rentalReturnShippingFee: null,
    rentalReturnContact: "",
    storeName: "",
    storeAddress: null,
    visitCouponCode: "",
    visitBenefit: "",
  };
}

export function createEmptyDraft(): CampaignDraft {
  return {
    info: { name: "", brandIdx: null, campaignType: null, startDate: null },
    product: createEmptyProductDraft(),
    influencer: { platform: null, gender: null, ageGroups: [], topics: [] },
    addOns: [],
    intro: {
      mainImage: null,
      detailMedia: [],
      description: "",
      notice: "",
      titleHashtags: [],
      contentHashtags: [],
    },
    conditions: {
      headcount: null,
      rewardPerInfluencer: null,
      postingPeriodMonths: null,
      secondaryCopyright: null,
    },
    policy: { service: false, privacy: false, operation: false, reward: false },
  };
}
