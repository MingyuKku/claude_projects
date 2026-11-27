export const POSTING_GUIDE_METHODS = ["AI", "MANUAL"] as const;
export type PostingGuideMethod = (typeof POSTING_GUIDE_METHODS)[number];

export const POSTING_GUIDE_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "SKIPPED",
] as const;
export type PostingGuideStatus = (typeof POSTING_GUIDE_STATUSES)[number];

/** 화면이 쓰는 가이드. 모르는 방식·상태 코드는 null. */
export interface PostingGuide {
  method: PostingGuideMethod | null;
  status: PostingGuideStatus | null;
  basicCondition: PostingGuideBasicCondition;
  /** 예시 탭의 콘텐츠 개요(300자). */
  contentGuide: string;
  needsAttention: boolean;
}

/** 기본 조건(`PUT …/basic-condition`). 보낸 값으로 전체 교체됨. */
export interface PostingGuideBasicCondition {
  minPhotoCount: number | null;
  minVideoCount: number | null;
  requiredKeywords: string[];
  requiredHashtags: string[];
  notice: string;
  referenceUrls: string[];
  /** 사진·영상 필수 여부. 화면에 입력칸이 없지만 전체 교체라 받은 값을 그대로 돌려 보냄. */
  photoType: string | null;
  videoType: string | null;
}

export interface PostingGuidePreview {
  campaignName: string;
  /** 서버가 주는 유형 이름(DB 값) 그대로. */
  campaignType: string | null;
  /** "2025.12.12 - 2026.12.12". 서버 값이 없으면 null. */
  period: string | null;
  campaignCode: string;
  brandName: string | null;
  brandImageUrl: string | null;
  guide: PostingGuide;
}

export interface PostingGuidePayment {
  cost: number;
  balance: number;
  shortfallAmount: number;
  isPaid: boolean;
}

/** 기본 조건 입력 제한(요구명세 REQ-14-0085, 시안 14165:272858). */
export const POSTING_GUIDE_LIMITS = {
  keywordCount: 10,
  hashtagCount: 10,
  noticeLength: 300,
  contentGuideLength: 300,
  mediaCountDigits: 2,
} as const;

export function createEmptyBasicCondition(): PostingGuideBasicCondition {
  return {
    minPhotoCount: null,
    minVideoCount: null,
    requiredKeywords: [],
    requiredHashtags: [],
    notice: "",
    referenceUrls: [],
    photoType: null,
    videoType: null,
  };
}

/** 확정에 필요한 값(시안의 필수 *: 사진 수·영상 수·필수 키워드·필수 해시태그)이 다 있는지. */
export function isBasicConditionComplete(
  condition: PostingGuideBasicCondition,
) {
  return (
    condition.minPhotoCount !== null &&
    condition.minVideoCount !== null &&
    condition.requiredKeywords.length > 0 &&
    condition.requiredHashtags.length > 0
  );
}
