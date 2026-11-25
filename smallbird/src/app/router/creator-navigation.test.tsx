import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import {
  mockSession,
  mockSessionError,
  mockV3Get,
  renderRoute,
  resetSession,
} from "./test-utils";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), post: vi.fn() },
}));

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: "테스트",
  identifier: "tester",
  email: "test@example.com",
};

const MATCHING_RESPONSES: Record<string, unknown> = {
  "/matching/influencer/search": { list: [], hasMore: false },
  "/matching/bookmark": { list: [], hasMore: false, totalCount: 0 },
  "/matching/bookmark/folder": [
    { folderIdx: null, name: "전체", count: 0, avatarUrls: [] },
  ],
  "/matching/platform": { result: true, list: [] },
  "/matching/category": {
    result: true,
    list: [{ categoryIdx: 178, name: "전체", default: true }],
  },
};

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  // 폴더 캐러셀(embla)이 matchMedia·IntersectionObserver를 쓰는데 jsdom에는 없음.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  resetSession(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "MASTER", userIdx: 1 });
  mockV3Get((path) => Promise.resolve(MATCHING_RESPONSES[path]));
});

describe("크리에이터 검색 진입", () => {
  it("로그인하지 않았으면 로그인으로 이동한다", async () => {
    mockSessionError(new ApiError(401, undefined));
    const router = await renderRoute(
      `${ROUTES.creatorSearch}?platform=instagram`,
    );

    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  it("권한이 있으면 셸 안에서 검색 화면을 보여 주고 LNB 현재 위치를 표시한다", async () => {
    mockSession({ ...session, isInfluencerMatchingAccess: true });
    await renderRoute(ROUTES.creatorSearch);

    expect(
      await screen.findByText("해당하는 크리에이터가 없습니다."),
    ).toBeInTheDocument();

    // 검색은 접힌 레일로 두고, 펼친 LNB가 본문 위를 덮음.
    expect(
      screen.queryByRole("button", { name: "메뉴 접기" }),
    ).not.toBeInTheDocument();
    // jsdom에는 PC·TAB 레일이 함께 있음.
    await userEvent.click(
      screen.getAllByRole("button", { name: "전체 메뉴 열기" })[0]!,
    );
    expect(
      within(
        await screen.findByRole("dialog", { name: "전체 메뉴" }),
      ).getByRole("link", { name: "크리에이터 검색" }),
    ).toHaveAttribute("aria-current", "page");
  });
});

describe("크리에이터 관리 진입", () => {
  it("로그인하지 않았으면 로그인으로 이동한다", async () => {
    mockSessionError(new ApiError(401, undefined));
    const router = await renderRoute(ROUTES.creatorManage);

    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  it("권한이 있으면 셸 안에서 즐겨찾기 그룹을 보여 주고 LNB 현재 위치를 표시한다", async () => {
    mockSession({ ...session, isInfluencerMatchingAccess: true });
    await renderRoute(ROUTES.creatorManage);

    expect(
      await screen.findByRole("heading", { name: "즐겨찾기 그룹" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("아직 저장된 크리에이터가 없습니다."),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: "크리에이터 관리" },
      ),
    ).toHaveAttribute("aria-current", "page");
  });
});
