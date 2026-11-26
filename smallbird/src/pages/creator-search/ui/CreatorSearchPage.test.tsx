import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";

import { CreatorSearchPage } from "./CreatorSearchPage";

import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const ALL_CATEGORY_IDX = 178;
const BEAUTY_IDX = 3;
const HOME_IDX = 9;

const HARU = {
  userIdx: 1,
  platformId: "haru_beauty",
  platformIdx: 1,
  nickname: "하루뷰티",
  profileImageUrl: null,
  categoryIdx: BEAUTY_IDX,
  followerCount: 1234,
  brandIndex: 41.2,
  groupBuyIndex: null,
  avgCommentWriterCount: 120,
  expectedCost: null,
  bookmarked: true,
  platformUrl: null as string | null,
};
const MINA = {
  ...HARU,
  userIdx: 2,
  platformId: "mina_home",
  nickname: "미나홈",
  categoryIdx: HOME_IDX,
  followerCount: 125_000,
  bookmarked: false,
};

let items: (Omit<
  typeof HARU,
  "followerCount" | "brandIndex" | "avgCommentWriterCount"
> & {
  followerCount: number | null;
  brandIndex: number | null;
  avgCommentWriterCount: number | null;
})[] = [];
let folders = [
  { folderIdx: null, name: "전체", count: 2, avatarUrls: [] },
  { folderIdx: 11, name: "뷰티 후보군", count: 50, avatarUrls: [] },
];

function searchRequests() {
  return vi
    .mocked(serverApiV3.get)
    .mock.calls.filter(
      ([path]) => path === "/matching/influencer/merged/search",
    );
}

function lastSearchParams() {
  return (
    searchRequests().at(-1)?.[1] as {
      params: Record<string, unknown>;
    }
  ).params;
}

function mockApi() {
  vi.mocked(serverApiV3.get).mockImplementation(((path: string) => {
    switch (path) {
      case "/matching/influencer/merged/search":
        return Promise.resolve({ list: items, hasMore: false });
      case "/matching/platform":
        // 서버 순서: 인스타그램·네이버 블로그·유튜브·X·틱톡
        return Promise.resolve({
          result: true,
          list: [
            { platformIdx: 1, name: "인스타그램" },
            { platformIdx: 2, name: "네이버 블로그" },
            { platformIdx: 3, name: "유튜브" },
            { platformIdx: 4, name: "X" },
            { platformIdx: 5, name: "틱톡" },
          ],
        });
      case "/matching/bookmark/folder":
        return Promise.resolve(folders);
      case "/matching/category":
        return Promise.resolve({
          result: true,
          list: [
            { categoryIdx: ALL_CATEGORY_IDX, name: "전체", default: true },
            { categoryIdx: BEAUTY_IDX, name: "뷰티", default: false },
            { categoryIdx: HOME_IDX, name: "가전", default: false },
          ],
        });
      default:
        return Promise.reject(new Error(`unmocked ${path}`));
    }
  }) as never);
}

function LocationProbe() {
  const { search } = useLocation();
  return <output data-testid="search">{search}</output>;
}

function setup(path = "/creators/search") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <Routes>
          <Route element={<Outlet context={{ displayName: "김빅링크" }} />}>
            <Route path="/creators/search" element={<CreatorSearchPage />} />
          </Route>
        </Routes>
        <LocationProbe />
      </SWRConfig>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

function mockMediaQuery(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

// TAB: 태블릿 이상만 맞고 데스크톱은 아님.
function mockTabletQuery() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("min-width: 768px"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

// 체크박스·프로필 다음부터의 머리글.
function columnHeaders() {
  return screen
    .getAllByRole("columnheader")
    .slice(2)
    .map((header) => header.textContent);
}

function bookmarkPosts() {
  return vi
    .mocked(serverApiV3.post)
    .mock.calls.filter(([path]) => path === "/matching/bookmark");
}

function findParagraph(text: string) {
  return screen.findByText(
    (_, element) => element?.tagName === "P" && element.textContent === text,
  );
}

// jsdom에는 Radix Select·메뉴가 쓰는 포인터 캡처·스크롤 API가 없음.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  vi.clearAllMocks();
  items = [HARU, MINA];
  folders = [
    { folderIdx: null, name: "전체", count: 2, avatarUrls: [] },
    { folderIdx: 11, name: "뷰티 후보군", count: 50, avatarUrls: [] },
  ];
  mockMediaQuery(true);
  vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  mockApi();
  vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
});

afterEach(() => vi.unstubAllGlobals());

describe("CreatorSearchPage", () => {
  it("전체 플랫폼·전체 카테고리·팔로워 많은 순으로 읽어 표로 보여 준다", async () => {
    setup();

    const row = (await screen.findByText("하루뷰티")).closest("tr");
    const cells = within(row as HTMLElement);
    expect(cells.getByText("@haru_beauty")).toBeInTheDocument();
    expect(cells.getByText("1.2K")).toBeInTheDocument();
    // 카테고리 칸은 서버가 '전체'가 아닌 값을 줄 때만 이름이 보임(여기서는 목록에 있는 뷰티).
    expect(cells.getByText("뷰티")).toBeInTheDocument();
    expect(screen.getByText("125K")).toBeInTheDocument();
    expect(lastSearchParams()).toMatchObject({
      categoryIdxList: String(ALL_CATEGORY_IDX),
      sort: "FOLLOWER_DESC",
      offset: 0,
    });
    expect(lastSearchParams().platformIdx).toBeUndefined();
    expect(
      screen.getByRole("button", { name: /^플랫폼(?! 정렬)/ }),
    ).toHaveTextContent("플랫폼");
  });

  it("수집 전이라 지표가 모두 null인 크리에이터도 -로 보여 준다", async () => {
    items = [
      HARU,
      {
        ...MINA,
        followerCount: null,
        brandIndex: null,
        avgCommentWriterCount: null,
      },
    ];
    setup();

    const row = (await screen.findByText("미나홈")).closest("tr");
    // 팔로워·브랜드·공구·댓글 작성자·예측비용
    expect(
      within(row as HTMLElement).getAllByText("-").length,
    ).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("하루뷰티")).toBeInTheDocument();
  });

  it("플랫폼 메뉴는 시안 순서로 보이고 하나를 고르면 그 플랫폼으로, 다시 누르면 전체로 읽는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("button", { name: /^플랫폼(?! 정렬)/ }));
    const options = await screen.findAllByRole("menuitemcheckbox");
    expect(options.map((option) => option.textContent)).toEqual([
      "인스타그램",
      "네이버 블로그",
      "유튜브",
      "틱톡",
      "엑스",
    ]);

    await user.click(screen.getByRole("menuitemcheckbox", { name: "유튜브" }));
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(
        "?platform=youtube",
      ),
    );
    await waitFor(() => expect(lastSearchParams().platformIdx).toBe(3));

    // 하나만 고름: 다른 플랫폼을 고르면 바뀜.
    await user.click(screen.getByRole("button", { name: /^플랫폼(?! 정렬)/ }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "틱톡" }),
    );
    await waitFor(() => expect(lastSearchParams().platformIdx).toBe(5));

    await user.click(screen.getByRole("button", { name: /^플랫폼(?! 정렬)/ }));
    const tiktok = await screen.findByRole("menuitemcheckbox", {
      name: "틱톡",
    });
    expect(tiktok).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "유튜브" }),
    ).toHaveAttribute("aria-checked", "false");
    await user.click(tiktok);
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/),
    );
  });

  it("주소의 플랫폼을 따르고, 모르는 값이면 전체 플랫폼으로 본다", async () => {
    setup("/creators/search?platform=facebook");

    await screen.findByText("하루뷰티");
    expect(lastSearchParams().platformIdx).toBeUndefined();
  });

  it("홈에서 넘어온 검색어와 플랫폼으로 검색한다", async () => {
    setup("/creators/search?keyword=스킨케어&platform=naver");

    await screen.findByText("하루뷰티");
    expect(lastSearchParams()).toMatchObject({
      platformIdx: 2,
      keyword: "스킨케어",
    });
    expect(screen.getByRole("searchbox")).toHaveValue("스킨케어");
  });

  it("카테고리는 여러 개 고를 수 있고 다시 누르면 해제된다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(
      screen.getByRole("button", { name: /^카테고리(?! 정렬)/ }),
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "뷰티" }),
    );
    await waitFor(() =>
      expect(lastSearchParams().categoryIdxList).toBe(String(BEAUTY_IDX)),
    );
    // 메뉴는 닫히지 않고 이어서 고를 수 있음.
    await user.click(screen.getByRole("menuitemcheckbox", { name: "가전" }));
    await waitFor(() =>
      expect(lastSearchParams().categoryIdxList).toBe(
        `${BEAUTY_IDX},${HOME_IDX}`,
      ),
    );
    expect(screen.getByTestId("search")).toHaveTextContent(
      `?category=${BEAUTY_IDX}%2C${HOME_IDX}`,
    );
    // 메뉴가 열려 있는 동안 바깥은 접근성 트리에서 가려짐.
    expect(
      screen.getByRole("button", { name: /^카테고리(?! 정렬)/, hidden: true }),
    ).toHaveTextContent("뷰티 외 1");

    await user.click(screen.getByRole("menuitemcheckbox", { name: "뷰티" }));
    await waitFor(() =>
      expect(lastSearchParams().categoryIdxList).toBe(String(HOME_IDX)),
    );
    await user.click(screen.getByRole("menuitemcheckbox", { name: "가전" }));
    // 모두 해제하면 주소에서 빠지고 전체로 읽음(앞서 읽은 결과는 캐시라 다시 요청하지 않음).
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/),
    );
    expect(
      screen.getByRole("button", { name: /^카테고리(?! 정렬)/, hidden: true }),
    ).toHaveTextContent("카테고리");
  });

  it("카테고리 메뉴의 전체를 누르면 고른 카테고리를 모두 해제한다", async () => {
    const user = setup(`/creators/search?category=${BEAUTY_IDX},${HOME_IDX}`);
    await screen.findByText("하루뷰티");

    await user.click(
      screen.getByRole("button", { name: /^카테고리(?! 정렬)/ }),
    );
    const all = await screen.findByRole("menuitemcheckbox", { name: "전체" });
    expect(all).toHaveAttribute("aria-checked", "false");
    await user.click(all);

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/),
    );
    expect(
      screen.getByRole("menuitemcheckbox", { name: "전체" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "뷰티" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("여러 카테고리 검색에서 같은 크리에이터가 여러 번 와도 한 줄만 보인다", async () => {
    items = [HARU, { ...HARU, categoryIdx: HOME_IDX }, MINA];
    setup();

    await screen.findByText("하루뷰티");
    expect(screen.getAllByText("하루뷰티")).toHaveLength(1);
  });

  it("검색어는 Enter로 적용하고 주소에 담는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.type(screen.getByRole("searchbox"), " haru {Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent("?keyword=haru"),
    );
    await waitFor(() => expect(lastSearchParams().keyword).toBe("haru"));
  });

  it("AI 예측비용을 고르면 그 값으로 다시 읽는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("button", { name: "AI 예측비용" }));
    const [minInput] = await screen.findAllByRole("textbox", { name: /최소/ });
    await user.type(minInput!, "50000");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(lastSearchParams().aiPredictedCostMin).toBe(50_000),
    );
  });

  it("PC는 닫을 수 없는 AI 추천 도우미를 보이고 입력은 꺼 둔다", async () => {
    setup();
    const assistant = await screen.findByRole("region", {
      name: "AI 추천 도우미",
    });
    expect(assistant).toHaveTextContent("안녕하세요, 김빅링크님!");
    expect(
      within(assistant).getByRole("textbox", {
        name: "추가 요청을 입력하세요.",
      }),
    ).toBeDisabled();
    expect(
      within(assistant).queryByRole("button", { name: "닫기" }),
    ).not.toBeInTheDocument();
  });

  it("PC 표는 브랜드 지수·공구 지수·팔로워 수·예상 비용·희망비용 칸을 보이고 희망비용은 -로 둔다", async () => {
    setup();

    await screen.findByText("하루뷰티");
    expect(columnHeaders()).toEqual([
      "플랫폼",
      "카테고리",
      "브랜드 지수",
      "공구 지수",
      "팔로워 수",
      "예측비용",
      "희망비용",
      "동작",
    ]);
  });

  it.each([
    ["youtube", "구독자 수"],
    ["naver", "구독자 수"],
    ["tiktok", "구독자 수"],
    ["instagram", "팔로워 수"],
    ["x", "팔로워 수"],
  ])(
    "플랫폼을 고르면(%s) 칸은 그대로 두고 팔로워 칸 이름만 바꾼다",
    async (platform, followerHeader) => {
      setup(`/creators/search?platform=${platform}`);

      await screen.findByText("하루뷰티");
      expect(columnHeaders()).toEqual([
        "플랫폼",
        "카테고리",
        "브랜드 지수",
        "공구 지수",
        followerHeader,
        "예측비용",
        "희망비용",
        "동작",
      ]);
    },
  );

  it("머리글을 누르면 그 칸 내림차순, 다시 누르면 오름차순으로 읽는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    expect(lastSearchParams().sort).toBe("FOLLOWER_DESC");

    await user.click(screen.getByRole("button", { name: "브랜드 지수 정렬" }));
    await waitFor(() =>
      expect(lastSearchParams().sort).toBe("BRAND_INDEX_DESC"),
    );
    expect(
      screen.getByRole("columnheader", { name: "브랜드 지수" }),
    ).toHaveAttribute("aria-sort", "descending");

    await user.click(screen.getByRole("button", { name: "브랜드 지수 정렬" }));
    await waitFor(() =>
      expect(lastSearchParams().sort).toBe("BRAND_INDEX_ASC"),
    );

    await user.click(screen.getByRole("button", { name: "크리에이터 정렬" }));
    await waitFor(() => expect(lastSearchParams().sort).toBe("NICKNAME_DESC"));

    // 플랫폼을 바꾸면 정렬하던 칸이 없어질 수 있어 기본 정렬로 돌아감.
    await user.click(screen.getByRole("button", { name: /^플랫폼(?! 정렬)/ }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "유튜브" }),
    );
    await waitFor(() => expect(lastSearchParams().sort).toBe("FOLLOWER_DESC"));
  });

  it("TAB은 플랫폼·브랜드 지수·공구 지수만 한 줄 표로 보인다", async () => {
    mockTabletQuery();
    setup();

    await screen.findByText("하루뷰티");
    expect(columnHeaders()).toEqual([
      "플랫폼",
      "브랜드 지수",
      "공구 지수",
      "동작",
    ]);
  });

  it("MO는 두 줄 카드에 플랫폼·브랜드 지수·공구 지수를 보인다", async () => {
    mockMediaQuery(false);
    setup();

    const card = within(
      (await screen.findByText("하루뷰티")).closest("li") as HTMLElement,
    );
    expect(card.getByText("브랜드 지수")).toBeInTheDocument();
    expect(card.getByText("41.2")).toBeInTheDocument();
    expect(card.getByText("공구 지수")).toBeInTheDocument();
    expect(card.queryByText("팔로워 수")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("TAB·MO는 둥근 버튼으로 AI 추천 도우미를 열고 닫는다", async () => {
    mockMediaQuery(false);
    const user = setup();
    await user.click(
      await screen.findByRole("button", { name: "AI 추천 도우미" }),
    );
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(
      screen.queryByRole("region", { name: "AI 추천 도우미" }),
    ).not.toBeInTheDocument();
  });

  it("조건이 있을 때 새로고침을 누르면 모두 지우고, 없으면 다시 읽는다", async () => {
    const user = setup("/creators/search?platform=youtube&keyword=haru");
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("button", { name: "새로고침" }));
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/),
    );
    await waitFor(() =>
      expect(lastSearchParams()).not.toHaveProperty("keyword", "haru"),
    );
    expect(lastSearchParams().platformIdx).toBeUndefined();

    const callCount = searchRequests().length;
    await user.click(screen.getByRole("button", { name: "새로고침" }));
    await waitFor(() =>
      expect(searchRequests().length).toBeGreaterThan(callCount),
    );
  });

  it("결과가 없으면 안내한다", async () => {
    items = [];
    setup();

    expect(
      await screen.findByText("해당하는 크리에이터가 없습니다."),
    ).toBeInTheDocument();
  });

  it("선택이 없어도 하단 바가 보이고 버튼은 꺼져 있다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    expect(await findParagraph("0개 선택 됨")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "즐겨찾기 저장" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "즐겨찾기 해제" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "캠페인 제안" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "하루뷰티 선택" }));
    expect(await findParagraph("1개 선택 됨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "즐겨찾기 해제" })).toBeEnabled();
  });

  it("고른 크리에이터를 해제하면 모든 폴더에서 해제하고 목록을 다시 읽는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("checkbox", { name: "하루뷰티 선택" }));

    vi.mocked(serverApiV3.delete).mockImplementation(() => {
      items = [{ ...HARU, bookmarked: false }, MINA];
      return Promise.resolve({ result: true });
    });
    await user.click(screen.getByRole("button", { name: "즐겨찾기 해제" }));
    const alert = await screen.findByRole("alertdialog");
    await user.click(within(alert).getByRole("button", { name: "해제" }));

    await waitFor(() =>
      expect(serverApiV3.delete).toHaveBeenCalledWith("/matching/bookmark", {
        body: {
          targets: [{ platformIdx: 1, platformId: "haru_beauty" }],
          folderIdx: null,
        },
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(await findParagraph("0개 선택 됨")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "하루뷰티 즐겨찾기" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("저장된 크리에이터의 즐겨찾기를 누르면 해제 알럿을 띄운다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("button", { name: "하루뷰티 즐겨찾기" }));
    const alert = await screen.findByRole("alertdialog");
    expect(within(alert).getByText("즐겨찾기 해제")).toBeInTheDocument();
  });

  it("해제에 실패하면 알럿을 닫지 않고 오류를 알린다", async () => {
    vi.mocked(serverApiV3.delete).mockRejectedValue(new ApiError(500, null));
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("button", { name: "하루뷰티 즐겨찾기" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "해제",
      }),
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("플랫폼 목록을 읽지 못해도 안내하고 다시 시도하면 목록을 보여 준다", async () => {
    const readApi = vi.mocked(serverApiV3.get).getMockImplementation();
    let hasFailed = false;
    vi.mocked(serverApiV3.get).mockImplementation(((
      path: string,
      ...rest: unknown[]
    ) => {
      if (path === "/matching/platform" && !hasFailed) {
        hasFailed = true;
        return Promise.reject(new ApiError(500, null));
      }
      return readApi?.(path, ...(rest as []));
    }) as never);
    const user = setup();

    expect(
      await screen.findByText("크리에이터 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("하루뷰티")).toBeInTheDocument();
  });

  it("목록을 읽지 못하면 안내하고 다시 시도하면 목록을 보여 준다", async () => {
    const readApi = vi.mocked(serverApiV3.get).getMockImplementation();
    let hasFailed = false;
    vi.mocked(serverApiV3.get).mockImplementation(((
      path: string,
      ...rest: unknown[]
    ) => {
      if (path === "/matching/influencer/merged/search" && !hasFailed) {
        hasFailed = true;
        return Promise.reject(new ApiError(500, null));
      }
      return readApi?.(path, ...(rest as []));
    }) as never);
    const user = setup();

    expect(
      await screen.findByText("크리에이터 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("하루뷰티")).toBeInTheDocument();
  });
});

describe("CreatorSearchPage 즐겨찾기 저장", () => {
  it("고른 크리에이터를 폴더에 저장하고 목록을 다시 읽는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("checkbox", { name: "하루뷰티 선택" }));
    await user.click(screen.getByRole("checkbox", { name: "미나홈 선택" }));
    await user.click(screen.getByRole("button", { name: "즐겨찾기 저장" }));

    const drawer = await screen.findByRole("dialog", { name: "즐겨찾기 저장" });
    expect(
      within(drawer).getByRole("checkbox", { name: "미나홈 선택" }),
    ).toBeChecked();
    const save = within(drawer).getByRole("button", { name: "즐겨찾기 저장" });
    expect(save).toBeDisabled();
    expect(within(drawer).queryByText("전체")).not.toBeInTheDocument();

    await user.click(
      await within(drawer).findByRole("checkbox", { name: /뷰티 후보군/ }),
    );
    expect(save).toBeEnabled();
    const searchCount = searchRequests().length;
    await user.click(save);

    // 저장 API는 요청마다 카테고리가 하나라 카테고리별로 나눠 보냄.
    await waitFor(() => expect(bookmarkPosts()).toHaveLength(2));
    expect(serverApiV3.post).toHaveBeenCalledWith("/matching/bookmark", {
      platformIdx: 1,
      categoryIdx: BEAUTY_IDX,
      platformIds: ["haru_beauty"],
      folderIdxList: [11],
    });
    expect(serverApiV3.post).toHaveBeenCalledWith("/matching/bookmark", {
      platformIdx: 1,
      categoryIdx: HOME_IDX,
      platformIds: ["mina_home"],
      folderIdxList: [11],
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(searchRequests().length).toBeGreaterThan(searchCount);
  });

  it("저장 안 된 크리에이터의 즐겨찾기를 누르면 그 한 명으로 저장 창을 연다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("button", { name: "미나홈 즐겨찾기" }));

    const drawer = await screen.findByRole("dialog", { name: "즐겨찾기 저장" });
    expect(within(drawer).getByText("미나홈")).toBeInTheDocument();
    expect(within(drawer).queryByText("하루뷰티")).not.toBeInTheDocument();
  });

  it("채널 주소가 있으면 원본 SNS 채널을 새 창으로 연다", async () => {
    items = [
      HARU,
      { ...MINA, platformUrl: "https://www.instagram.com/mina_home" },
    ];
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "미나홈 즐겨찾기" }));
    const drawer = await screen.findByRole("dialog", { name: "즐겨찾기 저장" });

    expect(
      within(drawer).getByRole("link", { name: /인스타그램/ }),
    ).toHaveAttribute("href", "https://www.instagram.com/mina_home");
  });

  it("체크를 모두 끄면 폴더를 골라도 저장할 수 없다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "미나홈 즐겨찾기" }));
    const drawer = await screen.findByRole("dialog", { name: "즐겨찾기 저장" });

    await user.click(
      await within(drawer).findByRole("checkbox", { name: /뷰티 후보군/ }),
    );
    await user.click(
      within(drawer).getByRole("checkbox", { name: "미나홈 선택" }),
    );

    expect(
      within(drawer).getByRole("button", { name: "즐겨찾기 저장" }),
    ).toBeDisabled();
  });

  it("새 폴더를 만들면 그 폴더를 고른 상태로 둔다", async () => {
    vi.mocked(serverApiV3.post).mockImplementation(((
      path: string,
      body: { name: string },
    ) => {
      if (path !== "/matching/bookmark/folder")
        return Promise.resolve({ result: true });
      const created = {
        folderIdx: 12,
        name: body.name,
        count: 0,
        avatarUrls: [],
      };
      folders = [...folders, created];
      return Promise.resolve(created);
    }) as never);
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "미나홈 즐겨찾기" }));
    const drawer = await screen.findByRole("dialog", { name: "즐겨찾기 저장" });

    await user.click(
      within(drawer).getByRole("button", { name: "새 폴더 만들기" }),
    );
    expect(within(drawer).getByRole("button", { name: "생성" })).toBeDisabled();
    await user.type(
      within(drawer).getByRole("textbox", { name: "새 폴더" }),
      "VIP",
    );
    await user.click(within(drawer).getByRole("button", { name: "생성" }));

    expect(serverApiV3.post).toHaveBeenCalledWith("/matching/bookmark/folder", {
      name: "VIP",
    });
    expect(
      await within(drawer).findByRole("checkbox", { name: /VIP/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(within(drawer).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("MO는 크리에이터를 확인한 뒤 다음을 눌러 폴더를 고른다", async () => {
    mockMediaQuery(false);
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "미나홈 즐겨찾기" }));

    expect(await screen.findByText("선택 크리에이터")).toBeInTheDocument();
    expect(screen.queryByText("즐겨찾기 폴더 선택")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(screen.getByText("즐겨찾기 폴더 선택")).toBeInTheDocument();
    expect(screen.queryByText("선택 크리에이터")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(await screen.findByText("하루뷰티")).toBeInTheDocument();
  });
});

describe("CreatorSearchPage 상세 필터", () => {
  it("PC 드로어에서 값을 고쳐 적용하면 그 조건으로 다시 읽는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));
    const drawer = await screen.findByRole("dialog", { name: "상세 필터" });
    const apply = within(drawer).getByRole("button", { name: "적용하기" });
    expect(apply).toBeDisabled();

    await user.type(
      within(drawer).getByRole("textbox", { name: "팔로워 수 최소값" }),
      "1,000",
    );
    await user.type(
      within(drawer).getByRole("textbox", { name: "팔로워 수 최대값" }),
      "5000",
    );
    await user.click(apply);

    await waitFor(() =>
      expect(lastSearchParams()).toMatchObject({
        followerMin: 1000,
        followerMax: 5000,
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: "상세 필터" }),
    ).not.toBeInTheDocument();
  });

  it("최소가 최대보다 크면 적용할 수 없다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));
    const drawer = await screen.findByRole("dialog", { name: "상세 필터" });

    const min = within(drawer).getByRole("textbox", {
      name: "팔로워 수 최소값",
    });
    await user.type(min, "500");
    await user.type(
      within(drawer).getByRole("textbox", { name: "팔로워 수 최대값" }),
      "100",
    );

    expect(min).toHaveAttribute("aria-invalid", "true");
    expect(
      within(drawer).getByRole("button", { name: "적용하기" }),
    ).toBeDisabled();
  });

  it("최소가 최대보다 큰 채로 칸을 벗어나면 알럿을 띄우고, 확인하면 그 칸을 비운다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));
    const drawer = await screen.findByRole("dialog", { name: "상세 필터" });
    const min = within(drawer).getByRole("textbox", {
      name: "팔로워 수 최소값",
    });
    const max = within(drawer).getByRole("textbox", {
      name: "팔로워 수 최대값",
    });

    await user.type(min, "500");
    await user.type(max, "100");
    await user.tab();

    const alert = await screen.findByRole("alertdialog", {
      name: "입력값을 확인해 주세요",
    });
    expect(
      within(alert).queryByRole("button", { name: "취소" }),
    ).not.toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "확인" }));

    expect(min).toHaveValue("500");
    expect(max).toHaveValue("");
    expect(min).not.toHaveAttribute("aria-invalid");
  });

  it("지수 최대값을 비워도 100이 아니라 빈칸으로 보인다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));
    const drawer = await screen.findByRole("dialog", { name: "상세 필터" });
    await user.click(within(drawer).getByRole("tab", { name: "Value" }));
    const max = within(drawer).getByRole("textbox", {
      name: "브랜드 영향력 지수 최대값",
    });

    await user.type(
      within(drawer).getByRole("textbox", {
        name: "브랜드 영향력 지수 최소값",
      }),
      "50",
    );
    await user.type(max, "10");
    await user.tab();
    await user.click(
      within(
        await screen.findByRole("alertdialog", {
          name: "입력값을 확인해 주세요",
        }),
      ).getByRole("button", { name: "확인" }),
    );

    expect(max).toHaveValue("");
  });

  it("지수는 100보다 큰 값을 받지 않고, 끝 눈금은 Max를 보내지 않는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));
    const drawer = await screen.findByRole("dialog", { name: "상세 필터" });
    await user.click(within(drawer).getByRole("tab", { name: "Value" }));

    const max = within(drawer).getByRole("textbox", {
      name: "브랜드 영향력 지수 최대값",
    });
    await user.type(max, "1000");
    expect(max).toHaveValue("100");
    await user.type(
      within(drawer).getByRole("textbox", {
        name: "브랜드 영향력 지수 최소값",
      }),
      "20",
    );
    await user.click(within(drawer).getByRole("button", { name: "적용하기" }));

    await waitFor(() =>
      expect(lastSearchParams()).toMatchObject({ brandIndexMin: 20 }),
    );
    expect(lastSearchParams()).not.toHaveProperty("brandIndexMax");
  });

  it("새로고침은 상세 필터도 지운다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));
    const drawer = await screen.findByRole("dialog", { name: "상세 필터" });
    await user.type(
      within(drawer).getByRole("textbox", { name: "팔로워 수 최소값" }),
      "10",
    );
    await user.click(within(drawer).getByRole("button", { name: "적용하기" }));
    await waitFor(() =>
      expect(lastSearchParams()).toMatchObject({ followerMin: 10 }),
    );

    await user.click(screen.getByRole("button", { name: "새로고침" }));
    await user.click(screen.getByRole("button", { name: "상세 필터" }));

    expect(
      await screen.findByRole("textbox", { name: "팔로워 수 최소값" }),
    ).toHaveValue("");
  });

  it("MO 기본 필터에서 카테고리를 골라 적용하면 주소에 담는다", async () => {
    mockMediaQuery(false);
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "기본 필터" }));

    expect(await screen.findByText("기본 필터 설정")).toBeInTheDocument();
    const apply = screen.getByRole("button", { name: "적용하기" });
    expect(apply).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: /^카테고리(?! 정렬)/ }),
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "뷰티" }),
    );
    await user.keyboard("{Escape}");
    await user.click(apply);

    expect(await screen.findByText("하루뷰티")).toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveTextContent(
      `category=${BEAUTY_IDX}`,
    );
  });

  it("MO 상세 필터는 전체 화면으로 열고 닫는다", async () => {
    mockMediaQuery(false);
    const user = setup();
    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "상세 필터" }));

    expect(await screen.findByText("상세 필터 설정")).toBeInTheDocument();
    // 닫으면 보던 자리로 돌아가도록 목록을 남기고 덮음.
    expect(screen.getByText("하루뷰티").closest("[inert]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByText("상세 필터 설정")).not.toBeInTheDocument();
    expect(screen.getByText("하루뷰티").closest("[inert]")).toBeNull();
  });
});
