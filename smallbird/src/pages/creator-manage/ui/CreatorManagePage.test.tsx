import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";

import { CreatorManagePage } from "./CreatorManagePage";

import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: {
    get: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const HARU = {
  userIdx: 1,
  platformId: "haru_beauty",
  platformIdx: 3,
  nickname: "하루뷰티",
  profileImageUrl: null,
  categoryIdx: 3,
  followerCount: 1234,
  brandIndex: 41.2,
  groupBuyIndex: null,
  avgCommentWriterCount: 120,
  expectedCost: null,
  bookmarked: true,
};
const MINA = {
  ...HARU,
  userIdx: 2,
  platformId: "mina_home",
  platformIdx: 1,
  nickname: "미나홈",
  categoryIdx: 9,
  followerCount: 125_000,
};

const BEAUTY_FOLDER_IDX = 7;
const FOLDERS = [
  { folderIdx: null, name: "전체", count: 2, avatarUrls: [] },
  { folderIdx: BEAUTY_FOLDER_IDX, name: "뷰티 후보", count: 1, avatarUrls: [] },
];

let allItems: (typeof HARU)[] = [];
let folderItems: (typeof HARU)[] = [];

function bookmarkRequests() {
  return vi
    .mocked(serverApiV3.get)
    .mock.calls.filter(([path]) => path === "/matching/bookmark");
}

function mockApi() {
  vi.mocked(serverApiV3.get).mockImplementation(((
    path: string,
    options?: { params?: Record<string, unknown> },
  ) => {
    switch (path) {
      case "/matching/bookmark": {
        const list =
          options?.params?.folderIdx === BEAUTY_FOLDER_IDX
            ? folderItems
            : allItems;
        return Promise.resolve({
          list,
          hasMore: false,
          totalCount: list.length,
        });
      }
      case "/matching/bookmark/folder":
        return Promise.resolve(FOLDERS);
      case "/matching/platform":
        return Promise.resolve({
          result: true,
          list: [
            { platformIdx: 1, name: "인스타그램" },
            { platformIdx: 3, name: "유튜브" },
          ],
        });
      case "/matching/category":
        return Promise.resolve({
          result: true,
          list: [
            { categoryIdx: 178, name: "전체", default: true },
            { categoryIdx: 3, name: "뷰티", default: false },
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

function setup(path = "/creators/manage") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <Routes>
          <Route element={<Outlet context={{ displayName: "김빅링크" }} />}>
            <Route path="/creators/manage" element={<CreatorManagePage />} />
          </Route>
        </Routes>
        <LocationProbe />
      </SWRConfig>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

// "총 2 개"처럼 숫자가 별도 요소에 있는 문구는 요소의 전체 글자로 찾음.
function findParagraph(text: string) {
  return screen.findByText(
    (_, element) => element?.tagName === "P" && element.textContent === text,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  allItems = [HARU, MINA];
  folderItems = [HARU];
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: true,
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
  mockApi();
  vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
});

afterEach(() => vi.unstubAllGlobals());

describe("CreatorManagePage", () => {
  it("저장된 크리에이터를 표로 보여 주고 숫자는 줄여 쓴다", async () => {
    setup();

    const row = (await screen.findByText("하루뷰티")).closest("tr");
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement);
    expect(cells.getByText("@haru_beauty")).toBeInTheDocument();
    expect(cells.getByText("유튜브")).toBeInTheDocument();
    expect(cells.getByText("뷰티")).toBeInTheDocument();
    expect(cells.getByText("1.2K")).toBeInTheDocument();
    expect(cells.getByText("41.2")).toBeInTheDocument();
    // 공구 지수·예상 비용은 값이 없어 대시.
    expect(cells.getAllByText("-")).toHaveLength(2);
    expect(screen.getByText("125K")).toBeInTheDocument();
    expect(await findParagraph("총2개")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^전체/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("행을 고르면 하단 바 버튼이 켜지고 해제를 확인하면 모든 폴더에서 해제한다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");
    expect(await findParagraph("0개 선택 됨")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "즐겨찾기 해제" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "하루뷰티 선택" }));
    expect(await findParagraph("1개 선택 됨")).toBeInTheDocument();

    vi.mocked(serverApiV3.delete).mockImplementation(() => {
      allItems = [MINA];
      return Promise.resolve({ result: true });
    });
    await user.click(screen.getByRole("button", { name: "즐겨찾기 해제" }));
    const alert = await screen.findByRole("alertdialog");
    expect(within(alert).getByText("즐겨찾기 해제")).toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "해제" }));

    await waitFor(() =>
      expect(serverApiV3.delete).toHaveBeenCalledWith("/matching/bookmark", {
        body: {
          targets: [{ platformIdx: 3, platformId: "haru_beauty" }],
          folderIdx: null,
        },
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText("하루뷰티")).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await findParagraph("0개 선택 됨")).toBeInTheDocument();
  });

  it("머리글 체크박스는 불러온 행을 모두 고른다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    await user.click(screen.getByRole("checkbox", { name: "전체 선택" }));
    expect(await findParagraph("2개 선택 됨")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "전체 선택" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "즐겨찾기 해제" }),
      ).toBeDisabled(),
    );
  });

  it("폴더를 고르면 주소에 담고, 행의 즐겨찾기를 누르면 그 폴더에서만 해제한다", async () => {
    const user = setup();
    await screen.findByText("미나홈");

    await user.click(screen.getByRole("button", { name: /^뷰티 후보/ }));
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(
        `?folder=${BEAUTY_FOLDER_IDX}`,
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText("미나홈")).not.toBeInTheDocument(),
    );
    expect(bookmarkRequests().at(-1)?.[1]).toMatchObject({
      params: { folderIdx: BEAUTY_FOLDER_IDX },
    });

    await user.click(screen.getByRole("button", { name: "하루뷰티 즐겨찾기" }));
    const alert = await screen.findByRole("alertdialog");
    expect(
      within(alert).getByText("해당 폴더 즐겨찾기 해제"),
    ).toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "해제" }));

    await waitFor(() =>
      expect(serverApiV3.delete).toHaveBeenCalledWith("/matching/bookmark", {
        body: {
          targets: [{ platformIdx: 3, platformId: "haru_beauty" }],
          folderIdx: BEAUTY_FOLDER_IDX,
        },
      }),
    );
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

  it("저장된 크리에이터가 하나도 없으면 검색으로 안내한다", async () => {
    allItems = [];
    setup();

    expect(
      await screen.findByText("아직 저장된 크리에이터가 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "크리에이터 검색 바로가기" }),
    ).toHaveAttribute("href", "/creators/search");
  });

  it("고른 폴더가 비었으면 둘러보기로 안내한다", async () => {
    folderItems = [];
    setup(`/creators/manage?folder=${BEAUTY_FOLDER_IDX}`);

    expect(
      await screen.findByText("저장된 크리에이터가 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "크리에이터 둘러보기" }),
    ).toHaveAttribute("href", "/creators/search");
  });

  it("목록을 읽지 못하면 안내하고 다시 시도하면 목록을 보여 준다", async () => {
    const readList = vi.mocked(serverApiV3.get).getMockImplementation();
    let hasFailed = false;
    vi.mocked(serverApiV3.get).mockImplementation(((
      path: string,
      ...rest: unknown[]
    ) => {
      if (path === "/matching/bookmark" && !hasFailed) {
        hasFailed = true;
        return Promise.reject(new ApiError(500, null));
      }
      return readList?.(path, ...(rest as []));
    }) as never);
    const user = setup();

    expect(
      await screen.findByText("크리에이터 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("하루뷰티")).toBeInTheDocument();
  });

  it("그룹 이동은 소속 폴더를 체크해 두고 고른 폴더로 바꿔 저장한다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue([
      { folderIdx: BEAUTY_FOLDER_IDX, name: "뷰티 후보", checked: true },
    ]);
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    const user = setup();

    await user.click(
      await screen.findByRole("checkbox", { name: "하루뷰티 선택" }),
    );
    await user.click(screen.getByRole("button", { name: "그룹 이동" }));
    const dialog = await screen.findByRole("dialog", { name: "그룹 이동" });
    const folder = await within(dialog).findByRole("checkbox", {
      name: "뷰티 후보",
    });
    expect(folder).toBeChecked();
    expect(
      within(dialog).queryByRole("checkbox", { name: "전체" }),
    ).not.toBeInTheDocument();

    await user.click(folder);
    expect(within(dialog).getByRole("button", { name: "저장" })).toBeDisabled();
    await user.click(within(dialog).getByText("뷰티 후보"));
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    expect(serverApiV3.put).toHaveBeenCalledWith("/matching/bookmark/move", {
      targets: [{ platformIdx: 3, platformId: "haru_beauty", categoryIdx: 3 }],
      folderIdxList: [BEAUTY_FOLDER_IDX],
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "그룹 이동" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("플랫폼을 고르면 주소와 요청에 담고 새로고침을 누르면 지운다", async () => {
    const user = setup(`/creators/manage?folder=${BEAUTY_FOLDER_IDX}`);

    await screen.findByText("하루뷰티");
    await user.click(screen.getByRole("button", { name: "플랫폼" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "유튜브" }),
    );
    expect(screen.getByTestId("search")).toHaveTextContent(
      `?folder=${BEAUTY_FOLDER_IDX}&platform=youtube`,
    );
    await waitFor(() =>
      expect(bookmarkRequests().at(-1)?.[1]?.params).toMatchObject({
        folderIdx: BEAUTY_FOLDER_IDX,
        platformIdx: 3,
      }),
    );
    await user.click(screen.getByRole("button", { name: "카테고리" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "뷰티" }),
    );
    await waitFor(() =>
      expect(bookmarkRequests().at(-1)?.[1]?.params).toMatchObject({
        platformIdx: 3,
        categoryIdxList: "3",
      }),
    );
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "새로고침" }));
    expect(screen.getByTestId("search").textContent).toBe(
      `?folder=${BEAUTY_FOLDER_IDX}`,
    );
  });

  it("TAB·MO는 둥근 버튼으로 AI 추천 도우미를 열고 닫는다", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const user = setup();
    await user.click(
      await screen.findByRole("button", { name: "AI 추천 도우미" }),
    );
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(
      screen.queryByRole("region", { name: "AI 추천 도우미" }),
    ).not.toBeInTheDocument();
  });

  it("그룹 설정은 저장을 눌러야 생성·이름·삭제를 보내고 닫으면 버린다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    const user = setup();
    const open = async () => {
      await user.click(await screen.findByRole("button", { name: "설정" }));
      return screen.findByRole("dialog", { name: "그룹 설정" });
    };

    let dialog = await open();
    expect(within(dialog).getByRole("button", { name: "저장" })).toBeDisabled();
    for (const name of ["전체 순서 변경", "전체 이름 수정", "전체 삭제"]) {
      expect(within(dialog).getByRole("button", { name })).toBeDisabled();
    }
    await user.click(
      await within(dialog).findByRole("button", {
        name: "뷰티 후보 이름 수정",
      }),
    );
    const name = within(dialog).getByRole("textbox", { name: "폴더명" });
    await user.clear(name);
    await user.type(name, "뷰티 확정");
    expect(within(dialog).getByRole("button", { name: "저장" })).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "수정 완료" }));
    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(serverApiV3.put).not.toHaveBeenCalled();

    dialog = await open();
    await user.click(
      await within(dialog).findByRole("button", { name: "뷰티 후보 삭제" }),
    );
    await user.click(await screen.findByRole("button", { name: "해제" }));
    await user.click(
      within(dialog).getByRole("button", { name: "새 폴더 만들기" }),
    );
    await user.type(
      within(dialog).getByRole("textbox", { name: "새 폴더" }),
      "여행{Enter}",
    );
    expect(serverApiV3.post).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/matching/bookmark/folder/sync",
        { folders: [{ folderIdx: null, name: "여행" }] },
      ),
    );
    expect(serverApiV3.put).toHaveBeenCalledTimes(1);
    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(serverApiV3.delete).not.toHaveBeenCalled();
  });

  it("한 명에게 캠페인을 골라 금액과 공구 수수료를 채워 제안한다", async () => {
    vi.mocked(serverApiV3.post).mockImplementation(((path: string) =>
      Promise.resolve(
        path.endsWith("/panel")
          ? {
              influencers: [
                {
                  platformIdx: 3,
                  platformId: "haru_beauty",
                  nickname: "하루뷰티",
                  platformUrl: null,
                  greetingMessage: "안녕하세요, 하루뷰티 크리에이터님!",
                },
              ],
              campaigns: [
                {
                  campaignIdx: 11,
                  campaignName: "봄 신상",
                  campaignServiceName: "공구형",
                  groupBuyType: true,
                },
              ],
            }
          : { results: [] },
      )) as never);
    const user = setup();

    await user.click(
      await screen.findByRole("button", { name: "하루뷰티 캠페인 제안" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "캠페인 제안" });
    await user.click(await within(dialog).findByRole("radio"));
    await user.type(within(dialog).getByLabelText("제안 금액"), "250000");
    const submit = within(dialog).getByRole("button", { name: "캠페인 제안" });
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText("공구 수수료"), "20");
    await user.click(submit);
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("캠페인 제안을 보냈습니다."),
    );

    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/matching/influencer/proposal",
      {
        campaignIdx: 11,
        amount: 250_000,
        groupBuyFeeRate: 20,
        targets: [
          { platformIdx: 3, platformId: "haru_beauty", categoryIdx: 3 },
        ],
      },
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "캠페인 제안" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("이미 제안한 크리에이터가 있으면 창을 두고 안내한다", async () => {
    vi.mocked(serverApiV3.post).mockImplementation(((path: string) =>
      path.endsWith("/panel")
        ? Promise.resolve({
            influencers: [],
            campaigns: [
              {
                campaignIdx: 11,
                campaignName: "봄 신상",
                campaignServiceName: "브랜드형",
                groupBuyType: false,
              },
            ],
          })
        : Promise.reject(new ApiError(409, null))) as never);
    const user = setup();

    await user.click(
      await screen.findByRole("button", { name: "하루뷰티 캠페인 제안" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "캠페인 제안" });
    await user.click(await within(dialog).findByRole("radio"));
    await user.type(within(dialog).getByLabelText("제안 금액"), "1000");
    await user.click(
      within(dialog).getByRole("button", { name: "캠페인 제안" }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "이미 제안한 크리에이터가 있어 보내지 못했습니다.",
      ),
    );
    expect(dialog).toBeInTheDocument();
  });

  it("이미 열어 본 전체 목록도 폴더에서 해제한 뒤 돌아가면 새로 읽는다", async () => {
    const user = setup();
    await screen.findByText("미나홈");
    await user.click(screen.getByRole("button", { name: /^뷰티 후보/ }));
    await waitFor(() =>
      expect(screen.queryByText("미나홈")).not.toBeInTheDocument(),
    );

    allItems = [MINA];
    folderItems = [];
    await user.click(screen.getByRole("button", { name: "하루뷰티 즐겨찾기" }));
    await user.click(await screen.findByRole("button", { name: "해제" }));
    await screen.findByText("저장된 크리에이터가 없습니다.");

    await user.click(screen.getByRole("button", { name: /^전체/ }));
    expect(await screen.findByText("미나홈")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("하루뷰티")).not.toBeInTheDocument(),
    );
  });

  it("주소의 플랫폼을 걸 수 없으면 전체를 보이지 않고 실패로 안내한다", async () => {
    const getMock = vi.mocked(serverApiV3.get).getMockImplementation();
    vi.mocked(serverApiV3.get).mockImplementation(((path: string, options) =>
      path === "/matching/platform"
        ? Promise.reject(new ApiError(500, null))
        : getMock?.(path, options)) as typeof serverApiV3.get);
    setup("/creators/manage?platform=youtube");

    expect(
      await screen.findByText("크리에이터 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    expect(bookmarkRequests()).toHaveLength(0);
  });

  it("폴더 목록을 못 읽으면 안내하고 다시 시도하면 폴더를 보인다", async () => {
    const getMock = vi.mocked(serverApiV3.get).getMockImplementation();
    let isFailing = true;
    vi.mocked(serverApiV3.get).mockImplementation(((path: string, options) =>
      isFailing && path === "/matching/bookmark/folder"
        ? Promise.reject(new ApiError(500, null))
        : getMock?.(path, options)) as typeof serverApiV3.get);
    const user = setup();

    const retry = await screen.findByRole("button", { name: "다시 시도" });
    isFailing = false;
    await user.click(retry);

    expect(
      await screen.findByRole("button", { name: /^뷰티 후보/ }),
    ).toBeInTheDocument();
  });

  it("검색어를 제출해도 검색칸의 초점이 남는다", async () => {
    const user = setup();
    await screen.findByText("하루뷰티");

    const search = screen.getByRole("searchbox");
    await user.type(search, "하루{Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("search").textContent).toContain("q="),
    );
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });
});
