import type { SubAccountAuthorization } from "./schema";

/** PC 시안의 한 쪽 행 수. TAB·MO도 같은 값을 씀. */
export const SUB_ACCOUNT_PAGE_SIZE = 8;

/** Sub ID 생성(`POST /sub`)에서 이미 있는 아이디. */
export const EXISTING_ID_REASON = "existing id";

/** Sub ID 생성에서 계정은 만들어지고 프로필 이미지 저장만 실패한 응답(400)의 `reason`. */
export const PROFILE_IMAGE_FAILURE_REASONS: readonly string[] = [
  "이미지 파일만 업로드할 수 있습니다.",
  "파일 업로드 도중 예외가 발생하였습니다.",
];

/** Sub ID 목록의 검색어·쪽 URL 쿼리. 탭을 바꾸면 페이지가 지움. */
export const KEYWORD_PARAM = "keyword";
export const PAGE_PARAM = "page";

/** 화면에 그리는 권한 순서. */
export const PERMISSION_KEYS = [
  "campaign",
  "creatorMatching",
  "creatorMarket",
  "commerce",
  "bigbirdMoney",
  "buyerInquiry",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** 권한 → 권한 API 필드. `PUT`은 바꾼 필드만 보냄(부분 수정). */
export const PERMISSION_FIELDS = {
  campaign: "isCampaignAccess",
  creatorMatching: "isInfluencerMatchingAccess",
  creatorMarket: "isInfluencerMarketAccess",
  commerce: "isCommerceAccess",
  buyerInquiry: "isPurchaserQuestionAccess",
  bigbirdMoney: "isBigbirdMoneyAccess",
} as const satisfies Record<
  PermissionKey,
  Exclude<keyof SubAccountAuthorization, "accountIdx">
>;

/**
 * 빈 목록 묶음의 최대 높이(시안의 빈 표 높이). 이보다 큰 화면에서는 더 늘어나지 않고 위에 붙음.
 */
export const EMPTY_LIST_MAX_HEIGHT_CLASS =
  "max-h-86.5 tablet:max-h-124 desktop:max-h-145";
