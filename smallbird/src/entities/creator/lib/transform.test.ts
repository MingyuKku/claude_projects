import { describe, expect, it } from "vitest";

import {
  transformCategories,
  transformCreatorDetail,
  transformCreatorMetrics,
  transformFeedComment,
  transformFeedDetail,
  transformFeedPost,
  transformPlatform,
} from "./transform";

describe("transformCategories", () => {
  it("'전체'와 하위 카테고리는 목록에서 빼고 '전체'는 idx·이름만 따로 둠", () => {
    expect(
      transformCategories([
        { categoryIdx: 178, name: "전체", default: true },
        { categoryIdx: 3, name: "뷰티", default: false },
        {
          categoryIdx: 301,
          name: "스킨케어",
          default: false,
          parentCategoryIdx: 3,
        },
      ]),
    ).toEqual({
      allCategoryIdx: 178,
      allCategoryName: "전체",
      categories: [{ categoryIdx: 3, name: "뷰티" }],
    });
  });

  it("'전체' 항목이 없으면 실패", () => {
    expect(() =>
      transformCategories([{ categoryIdx: 3, name: "뷰티", default: false }]),
    ).toThrow();
  });
});

describe("transformPlatform", () => {
  it("platformIdx를 플랫폼 코드로, 모르는 idx는 null로", () => {
    expect(transformPlatform({ platformIdx: 4, name: "X" }).code).toBe("x");
    expect(transformPlatform({ platformIdx: 9, name: "?" }).code).toBeNull();
  });
});

describe("transformCreatorDetail", () => {
  it("플랫폼 탭은 시안 순서이고 모르는 플랫폼은 맨 뒤", () => {
    const detail = transformCreatorDetail({
      userIdx: 1,
      platformIdx: 2,
      platformId: "haru",
      nickname: "하루",
      profileImageUrl: null,
      categoryIdx: 3,
      influencerServiceIdx: null,
      bookmarked: false,
      linkedPlatforms: [9, 4, 5, 3, 1].map((platformIdx) => ({
        platformIdx,
        platformId: "haru",
      })),
    });
    expect(detail.platforms.map((item) => item.platformIdx)).toEqual([
      1, 3, 5, 2, 4, 9,
    ]);
  });
});

describe("transformCreatorDetail 프로필", () => {
  const response = {
    userIdx: 1,
    platformIdx: 1,
    platformId: "haru",
    nickname: "하루",
    profileImageUrl: "old.png",
    categoryIdx: 3,
    influencerServiceIdx: null,
    bookmarked: false,
    linkedPlatforms: [],
  };

  it("공식 API 이름·이미지를 먼저 쓰고 없으면 상세 값을 씀", () => {
    expect(
      transformCreatorDetail(response, {
        displayName: "Haru",
        profileImageUrl: null,
      }),
    ).toMatchObject({ nickname: "Haru", profileImageUrl: "old.png" });
    expect(transformCreatorDetail(response, null).nickname).toBe("하루");
  });
});

describe("transformCreatorMetrics", () => {
  it("크롤링 지표가 없어도 공식 API 수치를 보이고 0은 값으로 봄", () => {
    const metrics = transformCreatorMetrics({
      followerCount: 10,
      avgViewCount: 0,
      crawler: null,
    });
    expect(metrics).toMatchObject({
      followerCount: 10,
      avgViewCount: 0,
      avgLikeCount: null,
      brandIndex: null,
      categoryBreakdown: [],
    });
  });
});

describe("merged 피드", () => {
  it("크롤링에 없는 게시물(tmiIdx·본문·날짜 null)도 변환함", () => {
    expect(
      transformFeedPost(
        {
          tmiIdx: null,
          articleUrl: "https://youtu.be/1",
          video: true,
          title: "영상 제목",
          content: null,
          articleDate: null,
          shareCount: 2,
        },
        3,
      ),
    ).toMatchObject({
      platformIdx: 3,
      tmiIdx: null,
      title: "영상 제목",
      content: "",
      articleDate: null,
      shareCount: 2,
    });
  });

  it("상세는 본문이 없으면 제목을, 댓글은 좋아요 수를 보임", () => {
    expect(
      transformFeedDetail({ video: true, title: "영상 제목", mediaUrls: null }),
    ).toMatchObject({ content: "영상 제목", mediaUrls: [] });
    expect(transformFeedComment({ likeCount: 0 })).toMatchObject({
      nickname: null,
      likeCount: 0,
    });
  });
});
