import { pick, sort } from "radash";

import { CREATOR_METRIC_KEYS, MATCHING_PLATFORM_CODES } from "../model/types";

import type {
  BookmarkFolderResponse,
  CreatorDetailResponse,
  CreatorFeedCommentResponse,
  CreatorFeedDetailResponse,
  CreatorFeedPostResponse,
  CreatorFilterOptionsResponse,
  CreatorIntroResponse,
  CreatorListItem,
  CreatorMetricsResponse,
  CreatorProfileResponse,
  ProposalPanelResponse,
} from "../model/schema";
import type {
  BookmarkFolder,
  CreatorDetail,
  CreatorFeedComment,
  CreatorFeedDetail,
  CreatorFeedPost,
  CreatorFilterOptions,
  CreatorIntro,
  CreatorMetrics,
  CreatorViewModel,
  MatchingCategories,
  MatchingPlatform,
  MatchingPlatformCode,
  ProposalPanel,
} from "../model/types";

export function creatorKey(platformIdx: number, platformId: string) {
  return `${platformIdx}:${platformId}`;
}

export function transformCreatorToViewModel(
  item: CreatorListItem,
): CreatorViewModel {
  return {
    key: creatorKey(item.platformIdx, item.platformId),
    platformIdx: item.platformIdx,
    platformId: item.platformId,
    categoryIdx: item.categoryIdx,
    nickname: item.nickname,
    profileImageUrl: item.profileImageUrl,
    followerCount: item.followerCount,
    brandIndex: item.brandIndex,
    groupBuyIndex: item.groupBuyIndex,
    avgCommentWriterCount: item.avgCommentWriterCount,
    expectedCost: item.expectedCost,
    isBookmarked: item.bookmarked,
    platformUrl: item.platformUrl ?? null,
  };
}

// 상세 탭 순서(시안). 검색 메뉴 순서와 다름. 모르는 플랫폼은 맨 뒤.
const DETAIL_PLATFORM_ORDER: readonly MatchingPlatformCode[] = [
  "instagram",
  "youtube",
  "tiktok",
  "naver",
  "x",
];

function getPlatformCode(platformIdx: number) {
  return MATCHING_PLATFORM_CODES[platformIdx - 1] ?? null;
}

function getDetailOrder(platformIdx: number) {
  const code = getPlatformCode(platformIdx);
  return code
    ? DETAIL_PLATFORM_ORDER.indexOf(code)
    : DETAIL_PLATFORM_ORDER.length;
}

export function transformPlatform(platform: {
  platformIdx: number;
  name: string;
}): MatchingPlatform {
  return {
    ...platform,
    code: getPlatformCode(platform.platformIdx),
  };
}

/** '전체'(`default`) 항목이 없으면 미선택 검색을 할 수 없으므로 실패로 다룸. */
export function transformCategories(
  list: {
    categoryIdx: number;
    name: string;
    default: boolean;
    parentCategoryIdx?: number | null;
  }[],
): MatchingCategories {
  const all = list.find((category) => category.default);
  if (!all) throw new Error("matching category list has no default item");
  return {
    allCategoryIdx: all.categoryIdx,
    allCategoryName: all.name,
    categories: list
      .filter(
        (category) => !category.default && category.parentCategoryIdx == null,
      )
      .map(({ categoryIdx, name }) => ({ categoryIdx, name })),
  };
}

export function transformCreatorDetail(
  response: CreatorDetailResponse,
  profile?: CreatorProfileResponse | null,
): CreatorDetail {
  const current = {
    platformIdx: response.platformIdx,
    platformId: response.platformId,
  };
  const linked = response.linkedPlatforms.filter(
    (item) => item.platformIdx !== current.platformIdx,
  );
  return {
    platformIdx: response.platformIdx,
    platformId: response.platformId,
    categoryIdx: response.categoryIdx,
    nickname: profile?.displayName || response.nickname,
    profileImageUrl: profile?.profileImageUrl || response.profileImageUrl,
    serviceTypeIdx: response.influencerServiceIdx,
    isBookmarked: response.bookmarked,
    platforms: sort([current, ...linked], (item) =>
      getDetailOrder(item.platformIdx),
    ),
  };
}

export function transformFilterOptions(
  response: CreatorFilterOptionsResponse,
): CreatorFilterOptions {
  return {
    influencerServiceTypes: response.influencerServiceTypes,
    genders: response.genders,
    ages: response.ages,
    ageGroups: response.ageGroups,
    hopeProducts: response.hopeProducts,
    areas: response.areas,
  };
}

export function transformBookmarkFolder({
  folderIdx,
  name,
  count,
  avatarUrls,
}: BookmarkFolderResponse): BookmarkFolder {
  return { folderIdx, name, count, avatarUrls };
}

const EMPTY_METRICS = {
  followerCount: null,
  followerCountChange: null,
  avgViewCount: null,
  avgViewCountChange: null,
  avgLikeCount: null,
  avgLikeCountChange: null,
  avgCommentCount: null,
  avgCommentCountChange: null,
  avgShareRatio: null,
  avgShareRatioChange: null,
  avgCommentWriterCount: null,
  avgCommentWriterCountChange: null,
  expectedCost: null,
  desiredCost: null,
  brandIndex: null,
  brandIndexChange: null,
  groupBuyIndex: null,
  groupBuyIndexChange: null,
};

export function transformCreatorMetrics(
  response: CreatorMetricsResponse,
): CreatorMetrics {
  const { crawler } = response;
  return {
    ...EMPTY_METRICS,
    ...(crawler && pick(crawler, [...CREATOR_METRIC_KEYS])),
    followerCount: response.followerCount ?? crawler?.followerCount ?? null,
    avgViewCount: response.avgViewCount ?? crawler?.avgViewCount ?? null,
    avgLikeCount: response.avgLikeCount ?? crawler?.avgLikeCount ?? null,
    avgCommentCount:
      response.avgCommentCount ?? crawler?.avgCommentCount ?? null,
    categoryBreakdown: crawler?.categoryBreakdown ?? [],
    topCommenters: crawler?.topCommenters ?? [],
    activityIndex: (crawler?.activityIndex ?? []).map(({ value }) => ({
      value,
    })),
    recentActivityTrend: crawler?.recentActivityTrend ?? [],
  };
}

export function transformCreatorIntro({
  married,
  ...intro
}: CreatorIntroResponse): CreatorIntro {
  return { ...intro, isMarried: married };
}

export function transformFeedPost(
  response: CreatorFeedPostResponse,
  platformIdx: number,
): CreatorFeedPost {
  return {
    platformIdx,
    tmiIdx: response.tmiIdx ?? null,
    articleUrl: response.articleUrl,
    isVideo: response.video,
    thumbnailUrl: response.thumbnailUrl ?? null,
    title: response.title || null,
    content: response.content ?? "",
    articleDate: response.articleDate ?? null,
    viewCount: response.viewCount ?? null,
    likeCount: response.likeCount ?? null,
    commentCount: response.commentCount ?? null,
    shareCount: response.shareCount ?? null,
  };
}

export function transformFeedDetail(
  response: CreatorFeedDetailResponse,
): CreatorFeedDetail {
  return {
    isVideo: response.video,
    mediaUrls: response.mediaUrls ?? [],
    // 상세 시안에 제목 자리가 없어 본문이 없을 때만 제목을 보임.
    content: response.content || response.title || "",
    articleDate: response.articleDate ?? null,
    viewCount: response.viewCount ?? null,
    likeCount: response.likeCount ?? null,
    commentCount: response.commentCount ?? null,
    shareCount: response.shareCount ?? null,
  };
}

export function transformFeedComment({
  nickname,
  content,
  commentDate,
  likeCount,
}: CreatorFeedCommentResponse): CreatorFeedComment {
  return {
    nickname: nickname ?? null,
    content: content ?? "",
    commentDate: commentDate ?? null,
    avatarUrl: null,
    likeCount: likeCount ?? null,
  };
}

export function transformProposalPanel(
  response: ProposalPanelResponse,
): ProposalPanel {
  return {
    creators: response.influencers.map((item) => ({
      nickname: item.nickname ?? item.platformId,
      platformUrl: item.platformUrl ?? null,
      greetingMessage: item.greetingMessage,
    })),
    campaigns: response.campaigns.map((item) => ({
      campaignIdx: item.campaignIdx,
      name: item.campaignName,
      typeName: item.campaignServiceName ?? null,
      isGroupBuy: item.groupBuyType,
    })),
  };
}
