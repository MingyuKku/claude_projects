import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { CreatorDetailPanel } from "./CreatorDetailPanel";

import type { CreatorViewModel } from "@/entities/creator";
import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn() },
}));

const creator: CreatorViewModel = {
  key: "1:haru",
  platformIdx: 1,
  platformId: "haru",
  categoryIdx: 5,
  nickname: "하루뷰티",
  profileImageUrl: null,
  followerCount: 1,
  brandIndex: null,
  groupBuyIndex: null,
  avgCommentWriterCount: null,
  expectedCost: null,
  isBookmarked: false,
  platformUrl: "https://instagram.com/haru",
};

const COUNTS = Object.fromEntries(
  [
    "followerCount",
    "avgViewCount",
    "avgLikeCount",
    "avgCommentCount",
    "avgShareRatio",
    "avgCommentWriterCount",
    "brandIndex",
    "groupBuyIndex",
  ].flatMap((key) => [
    [key, null],
    [`${key}Change`, null],
  ]),
);

function setup(layout: "desktop" | "mobile" = "desktop") {
  vi.mocked(serverApiV3.get).mockImplementation(((path: string) => {
    switch (path) {
      case "/matching/influencer/detail":
        return Promise.resolve({
          userIdx: 1,
          platformIdx: 1,
          platformId: "haru",
          nickname: "하루뷰티",
          profileImageUrl: null,
          categoryIdx: 5,
          influencerServiceIdx: 2,
          bookmarked: false,
          linkedPlatforms: [
            { platformIdx: 1, platformId: "haru" },
            { platformIdx: 3, platformId: "haru_tube" },
          ],
        });
      case "/matching/influencer/merged/profile":
        return Promise.reject(new Error("profile"));
      case "/matching/influencer/merged/account-metrics":
        return Promise.resolve({
          followerCount: 73027,
          crawler: {
            ...COUNTS,
            hasData: true,
            followerCount: 73027,
            followerCountChange: -3,
            expectedCost: null,
            desiredCost: null,
            brandIndex: 41.6,
            categoryBreakdown: [
              {
                categoryIdx: 5,
                categoryName: "뷰티",
                brandIndex: 31.5,
                groupBuyIndex: 20,
              },
            ],
            topCommenters: [{ rank: 1, nickname: "jina", commentCount: 99 }],
            activityIndex: [],
            recentActivityTrend: [],
          },
        });
      case "/matching/influencer/intro":
        return Promise.resolve({
          married: false,
          hasChildren: null,
          gender: null,
          age: "20대",
          ageGroup: "중반",
          area: "강남구",
          parentArea: "서울특별시",
          skinType: "복합성",
          currentJobs: ["모델", "마케터"],
          pastJobs: [],
          pet: null,
          interests: ["여행"],
          hopeProducts: [],
        });
      case "/matching/influencer/merged/feed":
        return Promise.resolve({
          hasMore: false,
          list: [
            {
              tmiIdx: null,
              articleUrl: "https://instagram.com/p/1",
              video: false,
              thumbnailUrl: null,
              content: "세럼 후기",
              articleDate: "2026-09-30T02:16:51",
              viewCount: null,
              likeCount: 5,
              commentCount: 6,
            },
          ],
        });
      case "/matching/influencer/merged/feed/detail":
        return Promise.resolve({
          video: false,
          mediaUrls: [],
          content: "세럼 후기 전체 #뷰티",
          articleDate: "2026-09-30T02:16:51",
          likeCount: 5,
          commentCount: 6,
        });
      case "/matching/influencer/merged/feed/comments":
        return Promise.resolve({
          hasMore: false,
          list: [
            {
              nickname: "jina",
              content: "색다른 조합이에요",
              commentDate: "2026-09-30T02:33:08",
            },
          ],
        });
      case "/matching/filter-options":
        return Promise.resolve({
          result: true,
          influencerServiceTypes: [{ idx: 2, name: "브랜드형" }],
        });
      case "/matching/platform":
        return Promise.resolve({
          result: true,
          list: [
            { platformIdx: 1, name: "인스타그램" },
            { platformIdx: 3, name: "유튜브" },
          ],
        });
      default:
        return Promise.resolve({
          result: true,
          list: [
            { categoryIdx: 178, name: "전체", default: true },
            { categoryIdx: 5, name: "뷰티", default: false },
          ],
        });
    }
  }) as never);
  const onClickBookmark = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <CreatorDetailPanel
        creator={creator}
        layout={layout}
        onClose={vi.fn()}
        onClickBookmark={onClickBookmark}
      />
    </SWRConfig>,
  );
  return { user: userEvent.setup(), onClickBookmark };
}

describe("CreatorDetailPanel", () => {
  it("프로필과 주요 지표를 보여 주고 값이 없으면 -로 둔다", async () => {
    setup();

    expect(await screen.findByText("73,027")).toBeInTheDocument();
    expect(screen.getByText("-3%")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    expect(await screen.findByText("브랜드형")).toBeInTheDocument();
    expect(screen.getByText("99개")).toBeInTheDocument();
  });

  it("카테고리별 지수 상세는 누르면 두 카드가 함께 펼쳐진다", async () => {
    const { user } = setup();
    const [button] = await screen.findAllByRole("button", {
      name: "카테고리별 지수 상세",
    });
    expect(screen.queryByText("31.5")).not.toBeInTheDocument();
    await user.click(button as HTMLElement);

    expect(screen.getByText("31.5")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("다른 플랫폼 탭은 그 플랫폼의 핸들로 다시 읽는다", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: "유튜브" }));

    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/matching/influencer/merged/account-metrics",
      { params: { platformIdx: 3, platformId: "haru_tube", categoryIdx: 5 } },
    );
  });

  it("소개 탭은 입력한 항목만 보이고 없는 항목은 -로 둔다", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: "소개" }));

    expect(await screen.findByText("현직업: 모델, 마케터")).toBeInTheDocument();
    expect(screen.queryByText(/전직업/)).not.toBeInTheDocument();
    expect(screen.getByText("20대 중반")).toBeInTheDocument();
    expect(screen.getByText("미혼")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "대한민국 지도: 서울시" }),
    ).toBeInTheDocument();
    expect(screen.getByText("여행")).toBeInTheDocument();
    // 자녀 관계·반려동물·희망 공구 품목
    expect(screen.getAllByText("-")).toHaveLength(3);
  });

  it("즐겨찾기를 누르면 저장 대상을 넘긴다", async () => {
    const { user, onClickBookmark } = setup();
    await user.click(
      await screen.findByRole("button", { name: "하루뷰티 즐겨찾기" }),
    );

    expect(onClickBookmark).toHaveBeenCalledWith(
      expect.objectContaining({ key: "1:haru", isBookmarked: false }),
    );
  });

  it.each(["desktop", "mobile"] as const)(
    "%s: 피드에서 게시물을 열어 댓글을 보고 목록으로 돌아오면 그 카드에 초점이 있다",
    async (layout) => {
      const { user } = setup(layout);

      await user.click(await screen.findByRole("tab", { name: "최근 피드" }));
      await user.click(
        await screen.findByRole("button", { name: "세럼 후기 2026. 09. 30" }),
      );
      expect(await screen.findByText("세럼 후기 전체")).toBeInTheDocument();
      expect(screen.getByText("#뷰티")).toBeInTheDocument();
      expect(await screen.findByText("색다른 조합이에요")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "목록으로 돌아가기" }),
      );
      expect(
        screen.getByRole("button", { name: "세럼 후기 2026. 09. 30" }),
      ).toHaveFocus();
    },
  );

  it("다른 플랫폼을 읽는 동안에도 플랫폼 탭이 남는다", async () => {
    const { user } = setup();
    const youtube = await screen.findByRole("tab", { name: "유튜브" });
    const getMock = vi.mocked(serverApiV3.get).getMockImplementation();
    vi.mocked(serverApiV3.get).mockImplementation(((path: string, options) =>
      path === "/matching/influencer/detail"
        ? new Promise(() => {})
        : getMock?.(path, options)) as typeof serverApiV3.get);

    await user.click(youtube);

    expect(screen.getByRole("tab", { name: "유튜브" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "인스타그램" })).toBeInTheDocument();
  });
});
