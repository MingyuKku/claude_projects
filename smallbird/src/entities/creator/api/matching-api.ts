import { ApiError, serverApiV3 } from "@/shared/api";

import {
  creatorKey,
  transformBookmarkFolder,
  transformCategories,
  transformCreatorDetail,
  transformCreatorIntro,
  transformCreatorMetrics,
  transformCreatorToViewModel,
  transformFeedComment,
  transformFeedDetail,
  transformFeedPost,
  transformFilterOptions,
  transformPlatform,
  transformProposalPanel,
} from "../lib/transform";
import {
  bookmarkFolderListSchema,
  bookmarkFolderMembershipSchema,
  bookmarkFolderSchema,
  bookmarkListSchema,
  creatorDetailSchema,
  creatorFeedCommentSchema,
  creatorFeedDetailSchema,
  creatorFeedSchema,
  creatorFilterOptionsSchema,
  creatorIntroSchema,
  creatorMetricsSchema,
  creatorProfileSchema,
  creatorSearchSchema,
  matchingCategoryListSchema,
  matchingPlatformListSchema,
  proposalPanelSchema,
} from "../model/schema";
import {
  toBookmarkQueryParams,
  toSearchQueryParams,
} from "../model/search-query";

import type {
  BookmarkListFilters,
  CreatorSearchFilters,
} from "../model/search-query";
import type {
  CreatorDetailTarget,
  CreatorFeedComment,
  CreatorFeedPost,
  CreatorFeedTarget,
  CreatorTarget,
  CreatorViewModel,
  OffsetPage,
} from "../model/types";

/** 무한 스크롤 한 묶음 건수(API 기본값). */
export const CREATOR_PAGE_SIZE = 15;
/** 댓글 한 묶음 건수(API 기본값). */
export const COMMENT_PAGE_SIZE = 20;

// V3는 실패를 HTTP 200 + `result: false`로 주는 경로가 있어 요청 실패로 다룸.
function ensureSucceeded<T extends { result: boolean }>(response: T): T {
  if (!response.result) throw new ApiError(200, response);
  return response;
}

export async function fetchMatchingPlatforms() {
  const response = matchingPlatformListSchema.parse(
    await serverApiV3.get("/matching/platform"),
  );
  return ensureSucceeded(response).list.map(transformPlatform);
}

export async function fetchMatchingCategories() {
  const response = matchingCategoryListSchema.parse(
    await serverApiV3.get("/matching/category"),
  );
  return transformCategories(ensureSucceeded(response).list);
}

export async function fetchCreatorFilterOptions() {
  const response = creatorFilterOptionsSchema.parse(
    await serverApiV3.get("/matching/filter-options"),
  );
  return transformFilterOptions(ensureSucceeded(response));
}

export async function fetchCreatorSearchPage(
  filters: CreatorSearchFilters,
  allCategoryIdx: number,
  offset: number,
): Promise<OffsetPage<CreatorViewModel>> {
  const response = creatorSearchSchema.parse(
    await serverApiV3.get("/matching/influencer/merged/search", {
      params: {
        ...toSearchQueryParams(filters, allCategoryIdx),
        offset,
        limit: CREATOR_PAGE_SIZE,
      },
    }),
  );
  return {
    items: response.list.map(transformCreatorToViewModel),
    hasMore: response.hasMore,
  };
}

export async function fetchBookmarkPage(
  filters: BookmarkListFilters,
  offset: number,
): Promise<OffsetPage<CreatorViewModel>> {
  const response = bookmarkListSchema.parse(
    await serverApiV3.get("/matching/bookmark", {
      params: {
        ...toBookmarkQueryParams(filters),
        offset,
        limit: CREATOR_PAGE_SIZE,
      },
    }),
  );
  return {
    items: response.list.map(transformCreatorToViewModel),
    hasMore: response.hasMore,
    totalCount: response.totalCount,
  };
}

export async function fetchBookmarkFolders() {
  return bookmarkFolderListSchema
    .parse(await serverApiV3.get("/matching/bookmark/folder"))
    .map(transformBookmarkFolder);
}

export async function createBookmarkFolder(name: string) {
  return transformBookmarkFolder(
    bookmarkFolderSchema.parse(
      await serverApiV3.post("/matching/bookmark/folder", { name }),
    ),
  );
}

/** 최종 폴더 목록을 한 번에 저장. 배열 순서가 정렬 순서이고, 목록에 없는 기존 폴더는 즐겨찾기까지 지워짐. */
export async function syncBookmarkFolders(
  folders: { folderIdx: number | null; name: string }[],
) {
  await serverApiV3.put("/matching/bookmark/folder/sync", { folders });
}

/** 고른 크리에이터가 모두 들어 있는 폴더 idx. */
export async function fetchCheckedFolderIdxs(targets: CreatorTarget[]) {
  const list = bookmarkFolderMembershipSchema.parse(
    await serverApiV3.post("/matching/bookmark/folder/membership", {
      targets: targets.map(toTarget),
    }),
  );
  return list.flatMap((item) => (item.checked ? [item.folderIdx] : []));
}

/**
 * 저장 API는 요청마다 플랫폼·카테고리가 하나라, 고른 크리에이터를 (플랫폼, 카테고리)별로 묶어 나눠 보냄.
 * ponytail: 서버가 항목별 categoryIdx(`targets`)를 받게 되면 한 번 호출로 바꿈.
 */
export async function saveBookmarks(
  creators: Pick<
    CreatorViewModel,
    "platformIdx" | "platformId" | "categoryIdx"
  >[],
  folderIdxList: number[],
) {
  const groups = new Map<
    string,
    { platformIdx: number; categoryIdx: number; platformIds: string[] }
  >();
  for (const { platformIdx, categoryIdx, platformId } of creators) {
    const groupKey = creatorKey(platformIdx, String(categoryIdx));
    const group = groups.get(groupKey) ?? {
      platformIdx,
      categoryIdx,
      platformIds: [],
    };
    group.platformIds.push(platformId);
    groups.set(groupKey, group);
  }
  // 한 묶음이 실패해도 나머지가 끝난 뒤 알려, 부르는 쪽이 저장된 만큼 다시 읽을 수 있게 함.
  const results = await Promise.allSettled(
    [...groups.values()].map((group) =>
      serverApiV3.post("/matching/bookmark", { ...group, folderIdxList }),
    ),
  );
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
}

/** `folderIdx`가 null이면 모든 폴더에서 해제. */
export async function removeBookmarks(
  targets: CreatorTarget[],
  folderIdx: number | null,
) {
  await serverApiV3.delete("/matching/bookmark", {
    body: { targets: targets.map(toTarget), folderIdx },
  });
}

/** 고른 크리에이터의 소속 폴더를 `folderIdxList`로 바꿈(치환). */
export async function moveBookmarks(
  creators: Pick<
    CreatorViewModel,
    "platformIdx" | "platformId" | "categoryIdx"
  >[],
  folderIdxList: number[],
) {
  await serverApiV3.put("/matching/bookmark/move", {
    targets: creators.map(({ platformIdx, platformId, categoryIdx }) => ({
      platformIdx,
      platformId,
      categoryIdx,
    })),
    folderIdxList,
  });
}

function toTarget({ platformIdx, platformId }: CreatorTarget) {
  return { platformIdx, platformId };
}

/** 상세 프로필. 서버 경로·파라미터 이름은 아직 influencer. */
export async function fetchCreatorDetail(target: CreatorDetailTarget) {
  const [response, profile] = await Promise.all([
    serverApiV3.get("/matching/influencer/detail", { params: { ...target } }),
    fetchCreatorProfile(target).catch((error: unknown) => {
      console.error("크리에이터 공식 API 프로필 조회 실패", error);
      return null;
    }),
  ]);
  return transformCreatorDetail(creatorDetailSchema.parse(response), profile);
}

// 즐겨찾기·속성·연동 플랫폼이 없어 detail을 대신하지 못함. 이름·이미지만 보태므로 실패하면 detail 값을 씀.
async function fetchCreatorProfile(target: CreatorTarget) {
  return creatorProfileSchema.parse(
    await serverApiV3.get("/matching/influencer/merged/profile", {
      params: toTarget(target),
    }),
  );
}

export async function fetchCreatorMetrics(target: CreatorDetailTarget) {
  return transformCreatorMetrics(
    creatorMetricsSchema.parse(
      await serverApiV3.get("/matching/influencer/merged/account-metrics", {
        params: { ...target },
      }),
    ),
  );
}

export async function fetchCreatorIntro({
  platformIdx,
  platformId,
}: CreatorTarget) {
  return transformCreatorIntro(
    creatorIntroSchema.parse(
      await serverApiV3.get("/matching/influencer/intro", {
        params: { platformIdx, platformId },
      }),
    ),
  );
}

export async function fetchCreatorFeedPage(
  { platformIdx, platformId }: CreatorTarget,
  offset: number,
): Promise<OffsetPage<CreatorFeedPost>> {
  const { list, hasMore } = creatorFeedSchema.parse(
    await serverApiV3.get("/matching/influencer/merged/feed", {
      params: { platformIdx, platformId, offset, limit: CREATOR_PAGE_SIZE },
    }),
  );
  return {
    items: list.map((item) => transformFeedPost(item, platformIdx)),
    hasMore,
  };
}

function toFeedParams({ platformIdx, articleUrl, tmiIdx }: CreatorFeedTarget) {
  return { platformIdx, articleUrl, tmiIdx: tmiIdx ?? undefined };
}

export async function fetchCreatorFeedDetail(target: CreatorFeedTarget) {
  return transformFeedDetail(
    creatorFeedDetailSchema.parse(
      await serverApiV3.get("/matching/influencer/merged/feed/detail", {
        params: toFeedParams(target),
      }),
    ),
  );
}

export async function fetchCreatorFeedCommentPage(
  target: CreatorFeedTarget,
  offset: number,
): Promise<OffsetPage<CreatorFeedComment>> {
  const { list, hasMore } = creatorFeedCommentSchema.parse(
    await serverApiV3.get("/matching/influencer/merged/feed/comments", {
      params: { ...toFeedParams(target), offset, limit: COMMENT_PAGE_SIZE },
    }),
  );
  return { items: list.map(transformFeedComment), hasMore };
}

export async function fetchProposalPanel(targets: CreatorDetailTarget[]) {
  return transformProposalPanel(
    proposalPanelSchema.parse(
      await serverApiV3.post("/matching/influencer/proposal/panel", {
        targets: targets.map(toProposalTarget),
      }),
    ),
  );
}

interface CampaignProposal {
  campaignIdx: number;
  targets: CreatorDetailTarget[];
  amount: number;
  /** 공구형 캠페인만. */
  groupBuyFeeRate?: number;
}

/** 한 명이라도 같은 캠페인에 이미 제안했으면 전체가 409로 실패함. */
export async function sendCampaignProposal({
  targets,
  ...proposal
}: CampaignProposal) {
  await serverApiV3.post("/matching/influencer/proposal", {
    ...proposal,
    targets: targets.map(toProposalTarget),
  });
}

function toProposalTarget({
  platformIdx,
  platformId,
  categoryIdx,
}: CreatorDetailTarget) {
  return { platformIdx, platformId, categoryIdx };
}
