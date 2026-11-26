/** 매칭 플랫폼 코드. 서버 platformIdx 1~5 고정값과 1:1. */
export const MATCHING_PLATFORM_CODES = [
  "instagram",
  "naver",
  "youtube",
  "x",
  "tiktok",
] as const;

export type MatchingPlatformCode = (typeof MATCHING_PLATFORM_CODES)[number];

export interface MatchingPlatform {
  platformIdx: number;
  /** 모르는 platformIdx면 null → 서버 이름을 그대로 표시. */
  code: MatchingPlatformCode | null;
  name: string;
}

export interface MatchingCategory {
  categoryIdx: number;
  name: string;
}

export interface MatchingCategories {
  /** '전체'와 하위 카테고리를 뺀 1차 카테고리 목록(하위 카테고리 메뉴는 시안이 없음). */
  categories: MatchingCategory[];
  /** 미선택(전체) 검색 때 보내는 '전체' idx. */
  allCategoryIdx: number;
  /** 메뉴 맨 위 '전체' 행에 보이는 서버 이름. */
  allCategoryName: string;
}

export interface CreatorTarget {
  platformIdx: number;
  platformId: string;
}

export interface CreatorViewModel extends CreatorTarget {
  /** 목록 key. 플랫폼 + 핸들. */
  key: string;
  categoryIdx: number;
  nickname: string;
  profileImageUrl: string | null;
  followerCount: number | null;
  brandIndex: number | null;
  groupBuyIndex: number | null;
  avgCommentWriterCount: number | null;
  expectedCost: number | null;
  isBookmarked: boolean;
  /** 원본 SNS 채널 주소. 없으면 바로가기를 끔. */
  platformUrl: string | null;
}

/** offset·hasMore 방식 목록의 한 묶음. */
export interface OffsetPage<T> {
  items: T[];
  hasMore: boolean;
  /** 즐겨찾기 목록만 줌. */
  totalCount?: number;
}

/** 목록 하단(이어 읽기)이 읽는 모양. */
export interface LoadMoreView {
  hasMore: boolean;
  /** 지금까지 읽은 묶음 수. */
  pageCount: number;
  isLoadingMore: boolean;
  isLoadMoreError: boolean;
  loadMore: () => void;
  reload: () => unknown;
}

/** 목록 화면이 읽는 모양. `useBookmarkList`·`useCreatorSearch`가 같이 맞춤. */
export interface CreatorListView extends LoadMoreView {
  items: CreatorViewModel[];
  isLoading: boolean;
  isError: boolean;
}

/** 게시물 상세·댓글을 여는 키. 목록 응답 값을 그대로 돌려줌. */
export interface CreatorFeedTarget {
  platformIdx: number;
  /** 크롤링에 없는 게시물이면 null. */
  tmiIdx: number | null;
  articleUrl: string;
}

/** 상세를 여는 키. `categoryIdx`는 상세·지표 API가 요구해 목록 행 값을 그대로 씀. */
export interface CreatorDetailTarget {
  platformIdx: number;
  platformId: string;
  categoryIdx: number;
}

export interface CreatorDetail extends CreatorDetailTarget {
  nickname: string;
  profileImageUrl: string | null;
  /** 1 통합형·2 브랜드형·3 공구형. 비회원이면 null. 이름은 `filter-options`의 서버 이름을 씀. */
  serviceTypeIdx: number | null;
  isBookmarked: boolean;
  /** 이 크리에이터가 연동한 플랫폼(지금 플랫폼 포함). 비회원은 지금 플랫폼 하나. */
  platforms: { platformIdx: number; platformId: string }[];
}

export interface IdxOption {
  idx: number;
  name: string;
}

export interface AreaOption {
  areaIdx: number;
  name: string;
  /** null이면 시/도. */
  parentAreaIdx: number | null;
}

/** 상세 필터 프로필 탭 선택지. */
export interface CreatorFilterOptions {
  influencerServiceTypes: IdxOption[];
  genders: IdxOption[];
  ages: IdxOption[];
  ageGroups: IdxOption[];
  hopeProducts: IdxOption[];
  areas: AreaOption[];
}

export interface BookmarkFolder {
  /** null이면 `전체`. */
  folderIdx: number | null;
  name: string;
  count: number;
  avatarUrls: string[];
}

export const CREATOR_METRIC_KEYS = [
  "followerCount",
  "followerCountChange",
  "avgViewCount",
  "avgViewCountChange",
  "avgLikeCount",
  "avgLikeCountChange",
  "avgCommentCount",
  "avgCommentCountChange",
  "avgShareRatio",
  "avgShareRatioChange",
  "avgCommentWriterCount",
  "avgCommentWriterCountChange",
  "expectedCost",
  "desiredCost",
  "brandIndex",
  "brandIndexChange",
  "groupBuyIndex",
  "groupBuyIndexChange",
] as const;

type CreatorMetricValues = Record<
  (typeof CREATOR_METRIC_KEYS)[number],
  number | null
>;

export interface CreatorMetrics extends CreatorMetricValues {
  categoryBreakdown: {
    categoryIdx: number;
    categoryName: string;
    brandIndex: number | null;
    groupBuyIndex: number | null;
  }[];
  topCommenters: { rank: number; nickname: string; commentCount: number }[];
  /** 노출수·좋아요·공유·조회·댓글 순서 고정. */
  activityIndex: { value: number | null }[];
  recentActivityTrend: { yearMonth: string; followerCount: number | null }[];
}

export interface CreatorIntro {
  isMarried: boolean | null;
  hasChildren: boolean | null;
  gender: string | null;
  age: string | null;
  ageGroup: string | null;
  area: string | null;
  parentArea: string | null;
  skinType: string | null;
  currentJobs: string[];
  pastJobs: string[];
  pet: string | null;
  interests: string[];
  hopeProducts: string[];
}

interface PostCounts {
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
}

export interface CreatorFeedPost extends CreatorFeedTarget, PostCounts {
  isVideo: boolean;
  thumbnailUrl: string | null;
  /** 유튜브 영상 제목. 다른 플랫폼은 서버가 주지 않아 null. */
  title: string | null;
  content: string;
  articleDate: string | null;
  shareCount: number | null;
}

export interface CreatorFeedDetail extends PostCounts {
  isVideo: boolean;
  mediaUrls: string[];
  content: string;
  articleDate: string | null;
  shareCount: number | null;
}

export interface CreatorFeedComment {
  nickname: string | null;
  content: string;
  commentDate: string | null;
  /** 서버가 아직 주지 않아 null. */
  avatarUrl: string | null;
  /** 공식 API 댓글에만 있음. */
  likeCount: number | null;
}

export interface ProposalCampaign {
  campaignIdx: number;
  name: string;
  typeName: string | null;
  /** 공구형이면 제안할 때 공구 수수료가 필수이고, 아니면 보내면 안 됨. */
  isGroupBuy: boolean;
}

export interface ProposalPanel {
  /** 요청한 순서. */
  creators: {
    nickname: string;
    platformUrl: string | null;
    greetingMessage: string;
  }[];
  campaigns: ProposalCampaign[];
}
