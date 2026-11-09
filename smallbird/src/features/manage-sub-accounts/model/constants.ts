import type { SubAccountAuthorization } from "./schema";

/** PC 시안의 한 쪽 행 수. TAB·MO도 같은 값을 씀. */
export const SUB_ACCOUNT_PAGE_SIZE = 8;

/** Sub ID 생성(`POST /sub`)에서 이미 있는 아이디. */
export const EXISTING_ID_REASON = "existing id";

/** Sub ID 생성에서 계정은 만들어지고 프로필 이미지 저장만 실패한 응답(400)의 `reason`(Swagger 예시). */
export const PROFILE_IMAGE_FAILURE_REASONS: readonly string[] = [
  "이미지 파일만 업로드할 수 있습니다.",
  "파일 업로드 도중 예외가 발생하였습니다.",
];

/** Sub ID 목록의 검색어·쪽 URL 쿼리. 탭을 바꾸면 페이지가 지움. */
export const KEYWORD_PARAM = "keyword";
export const PAGE_PARAM = "page";

/** v3 권한 6개(스펙 §3). 화면에 그리는 순서(2026-10-27 시안: 빅버드 머니 다음 구매자 문의). */
export const PERMISSION_KEYS = [
  "campaign",
  "influencerMatching",
  "influencerMarket",
  "commerce",
  "bigbirdMoney",
  "buyerInquiry",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** 권한 → 권한 API 필드(2026-10-27부터 6개 모두 제공). `PUT`은 바꾼 필드만 보냄(부분 수정). */
export const PERMISSION_FIELDS = {
  campaign: "isCampaignAccess",
  influencerMatching: "isInfluencerMatchingAccess",
  influencerMarket: "isInfluencerMarketAccess",
  commerce: "isCommerceAccess",
  buyerInquiry: "isPurchaserQuestionAccess",
  bigbirdMoney: "isBigbirdMoneyAccess",
} as const satisfies Record<
  PermissionKey,
  Exclude<keyof SubAccountAuthorization, "accountIdx">
>;

/**
 * 빈 목록 묶음의 최대 높이(시안의 빈 표 높이). 이보다 큰 화면에서는 더 늘어나지 않고 위에 붙음.
 * MO 346(`10724:187941`)·TAB 496(`10724:187234`, 테두리 박스)·PC 580(`10724:186107`, 머리글 48 + 본문 530 + 테두리 2).
 */
export const EMPTY_LIST_MAX_HEIGHT_CLASS =
  "max-h-86.5 tablet:max-h-124 desktop:max-h-145";
