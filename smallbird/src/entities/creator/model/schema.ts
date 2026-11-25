import { z } from "zod";

const resultSchema = z.object({ result: z.boolean() });

/** `GET /v3/matching/platform`. 서버 고정 5개(platformIdx 오름차순). */
export const matchingPlatformListSchema = resultSchema.extend({
  list: z.array(z.object({ platformIdx: z.number(), name: z.string() })),
});

/**
 * `GET /v3/matching/category`. `default`는 '전체' 항목.
 * 하위 카테고리는 `parentCategoryIdx`로 구분해 같은 목록에 옴.
 */
export const matchingCategoryListSchema = resultSchema.extend({
  list: z.array(
    z.object({
      categoryIdx: z.number(),
      name: z.string(),
      default: z.boolean(),
      parentCategoryIdx: z.number().nullish(),
    }),
  ),
});

const idxNameSchema = z.object({ idx: z.number(), name: z.string() });

/** `GET /v3/matching/filter-options`. 상세 필터 프로필 탭 선택지. */
export const creatorFilterOptionsSchema = resultSchema.extend({
  influencerServiceTypes: z.array(idxNameSchema).default([]),
  genders: z.array(idxNameSchema).default([]),
  ages: z.array(idxNameSchema).default([]),
  ageGroups: z.array(idxNameSchema).default([]),
  hopeProducts: z.array(idxNameSchema).default([]),
  areas: z
    .array(
      z.object({
        areaIdx: z.number(),
        name: z.string(),
        parentAreaIdx: z.number().nullable(),
      }),
    )
    .default([]),
});

export type CreatorFilterOptionsResponse = z.infer<
  typeof creatorFilterOptionsSchema
>;

/** 검색·즐겨찾기 목록의 한 행. 비회원이면 `userIdx`가 null이라 식별은 platformIdx + platformId. */
export const creatorListItemSchema = z.object({
  userIdx: z.number().nullable(),
  platformId: z.string(),
  platformIdx: z.number(),
  nickname: z.string(),
  profileImageUrl: z.string().nullable(),
  categoryIdx: z.number(),
  followerCount: z.number(),
  brandIndex: z.number().nullable(),
  groupBuyIndex: z.number().nullable(),
  avgCommentWriterCount: z.number().nullable(),
  expectedCost: z.number().nullable(),
  bookmarked: z.boolean(),
  /** 원본 SNS 채널 주소. 주소 규칙을 모르는 플랫폼이면 null. */
  platformUrl: z.string().nullish(),
});

export type CreatorListItem = z.infer<typeof creatorListItemSchema>;

/** `GET /v3/matching/influencer/search`. `result` 없이 목록만 옴. */
export const creatorSearchSchema = z.object({
  list: z.array(creatorListItemSchema),
  hasMore: z.boolean(),
});

/** `GET /v3/matching/bookmark`. */
export const bookmarkListSchema = creatorSearchSchema.extend({
  totalCount: z.number(),
});

/** `GET /v3/matching/bookmark/folder`. 첫 항목은 전체(`folderIdx` null). */
export const bookmarkFolderListSchema = z.array(
  z.object({
    folderIdx: z.number().nullable(),
    name: z.string(),
    count: z.number(),
    avatarUrls: z.array(z.string()).default([]),
  }),
);

export type BookmarkFolderResponse = z.infer<
  typeof bookmarkFolderListSchema
>[number];

/** `POST /v3/matching/bookmark/folder`. */
export const bookmarkFolderSchema = bookmarkFolderListSchema.element;

/** `POST /v3/matching/bookmark/folder/membership`. 고른 크리에이터가 모두 들어 있으면 `checked`. */
export const bookmarkFolderMembershipSchema = z.array(
  z.object({ folderIdx: z.number(), name: z.string(), checked: z.boolean() }),
);

/**
 * `GET /v3/matching/influencer/detail`. 비회원은 `userIdx`·`influencerServiceIdx`가 null, `linkedPlatforms`가 빈 배열.
 * 플랫폼 탭은 `linkedPlatforms`의 플랫폼·핸들로 다시 조회함.
 */
export const creatorDetailSchema = z.object({
  userIdx: z.number().nullable(),
  platformIdx: z.number(),
  platformId: z.string(),
  nickname: z.string(),
  profileImageUrl: z.string().nullable(),
  categoryIdx: z.number(),
  influencerServiceIdx: z.number().nullable(),
  bookmarked: z.boolean(),
  linkedPlatforms: z
    .array(z.object({ platformIdx: z.number(), platformId: z.string() }))
    .default([]),
});

export type CreatorDetailResponse = z.infer<typeof creatorDetailSchema>;

/** `GET /v3/matching/influencer/merged/profile`. 공식 API 프로필이 없으면 값이 모두 null. */
export const creatorProfileSchema = z.object({
  displayName: z.string().nullish(),
  profileImageUrl: z.string().nullish(),
});

export type CreatorProfileResponse = z.infer<typeof creatorProfileSchema>;

const metricSchema = z.number().nullable();

/**
 * 크롤링 지표(`merged/account-metrics`의 `crawler`). 크롤링 데이터가 없으면 `hasData`가 false이고 수치가 모두 null.
 * 전월 대비(`*Change`)와 희망 비용은 서버가 아직 null만 줌.
 */
const crawlerMetricsSchema = z.object({
  hasData: z.boolean(),
  followerCount: metricSchema,
  followerCountChange: metricSchema,
  avgViewCount: metricSchema,
  avgViewCountChange: metricSchema,
  avgLikeCount: metricSchema,
  avgLikeCountChange: metricSchema,
  avgCommentCount: metricSchema,
  avgCommentCountChange: metricSchema,
  avgShareRatio: metricSchema,
  avgShareRatioChange: metricSchema,
  avgCommentWriterCount: metricSchema,
  avgCommentWriterCountChange: metricSchema,
  expectedCost: metricSchema,
  desiredCost: metricSchema,
  brandIndex: metricSchema,
  brandIndexChange: metricSchema,
  groupBuyIndex: metricSchema,
  groupBuyIndexChange: metricSchema,
  categoryBreakdown: z
    .array(
      z.object({
        categoryIdx: z.number(),
        categoryName: z.string(),
        brandIndex: metricSchema,
        groupBuyIndex: metricSchema,
      }),
    )
    .default([]),
  topCommenters: z
    .array(
      z.object({
        rank: z.number(),
        nickname: z.string(),
        commentCount: z.number(),
      }),
    )
    .default([]),
  /** 노출수·좋아요·공유·조회·댓글 순서 고정. */
  activityIndex: z
    .array(z.object({ label: z.string(), value: metricSchema }))
    .default([]),
  recentActivityTrend: z
    .array(z.object({ yearMonth: z.string(), followerCount: metricSchema }))
    .default([]),
});

/**
 * `GET /v3/matching/influencer/merged/account-metrics`. 바깥 수치는 서버가 공식 API → 크롤링 순으로 합친 값.
 * 지수·활동 지표는 `crawler`에만 있음.
 */
export const creatorMetricsSchema = z.object({
  followerCount: z.number().nullish(),
  avgViewCount: z.number().nullish(),
  avgLikeCount: z.number().nullish(),
  avgCommentCount: z.number().nullish(),
  crawler: crawlerMetricsSchema.nullish(),
});

export type CreatorMetricsResponse = z.infer<typeof creatorMetricsSchema>;

const introTextSchema = z.string().nullable();
const introListSchema = z.array(z.string()).default([]);

/** `GET /v3/matching/influencer/intro`. 비회원이거나 입력하지 않은 항목은 null 또는 빈 배열. */
export const creatorIntroSchema = z.object({
  married: z.boolean().nullable(),
  hasChildren: z.boolean().nullable(),
  gender: introTextSchema,
  age: introTextSchema,
  ageGroup: introTextSchema,
  area: introTextSchema,
  parentArea: introTextSchema,
  skinType: introTextSchema,
  currentJobs: introListSchema,
  pastJobs: introListSchema,
  pet: introTextSchema,
  interests: introListSchema,
  hopeProducts: introListSchema,
});

export type CreatorIntroResponse = z.infer<typeof creatorIntroSchema>;

const feedCountSchema = z.number().nullish();

export const creatorFeedSchema = z.object({
  list: z.array(
    z.object({
      /** 크롤링에 없는 게시물이면 null. */
      tmiIdx: z.number().nullish(),
      articleUrl: z.string(),
      video: z.boolean(),
      /** 유튜브 영상 제목. */
      title: z.string().nullish(),
      thumbnailUrl: z.string().nullish(),
      content: z.string().nullish(),
      articleDate: z.string().nullish(),
      viewCount: feedCountSchema,
      likeCount: feedCountSchema,
      commentCount: feedCountSchema,
      shareCount: feedCountSchema,
    }),
  ),
  hasMore: z.boolean(),
});

export type CreatorFeedPostResponse = z.infer<
  typeof creatorFeedSchema
>["list"][number];

export const creatorFeedDetailSchema = z.object({
  video: z.boolean(),
  title: z.string().nullish(),
  mediaUrls: z.array(z.string()).nullish(),
  content: z.string().nullish(),
  articleDate: z.string().nullish(),
  viewCount: feedCountSchema,
  likeCount: feedCountSchema,
  commentCount: feedCountSchema,
  shareCount: feedCountSchema,
});

export type CreatorFeedDetailResponse = z.infer<typeof creatorFeedDetailSchema>;

export const creatorFeedCommentSchema = z.object({
  list: z.array(
    z.object({
      nickname: z.string().nullish(),
      content: z.string().nullish(),
      commentDate: z.string().nullish(),
      likeCount: feedCountSchema,
    }),
  ),
  hasMore: z.boolean(),
});

export type CreatorFeedCommentResponse = z.infer<
  typeof creatorFeedCommentSchema
>["list"][number];

/** `POST /v3/matching/influencer/proposal/panel`. */
export const proposalPanelSchema = z.object({
  influencers: z.array(
    z.object({
      platformIdx: z.number(),
      platformId: z.string(),
      nickname: z.string().nullish(),
      platformUrl: z.string().nullish(),
      greetingMessage: z.string(),
    }),
  ),
  campaigns: z.array(
    z.object({
      campaignIdx: z.number(),
      campaignName: z.string(),
      campaignServiceName: z.string().nullish(),
      /** 공구형이면 제안할 때 공구 수수료가 필수이고, 아니면 보내면 안 됨. */
      groupBuyType: z.boolean(),
    }),
  ),
});

export type ProposalPanelResponse = z.infer<typeof proposalPanelSchema>;
