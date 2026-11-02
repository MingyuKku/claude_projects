import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { SubAccountList } from "./SubAccountList";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn() },
}));

const PAGE_SIZE = 8;
const ACCOUNTS = Array.from({ length: 23 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    idx: 9000 + index,
    userIdx: null,
    identifier: `sub${number}`,
    name: `담당${number}`,
    email: `sub${number}@bigbird.com`,
    created: "2024-05-10T09:00:00",
  };
});

/** 서버 흉내: 검색어가 아이디·담당자명·이메일에 들어 있는 항목을 쪽으로 나눔. */
function respondSubAccounts(
  _path: string,
  options?: { params?: Record<string, unknown> },
) {
  const params = options?.params ?? {};
  const keyword = String(params.keyword ?? "");
  const page = Number(params.page);
  const size = Number(params.size);
  const matched = ACCOUNTS.filter((account) =>
    [account.identifier, account.name, account.email].some((value) =>
      value.includes(keyword),
    ),
  );
  return Promise.resolve({
    sub: matched.slice((page - 1) * size, page * size),
    pagingInfo: {
      page,
      size,
      totalCount: matched.length,
      totalPage: Math.ceil(matched.length / size),
    },
    searchInfo: { searchType: null, keyword },
  });
}

function mockViewport(isDesktop: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isDesktop,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function LocationProbe() {
  const { search } = useLocation();
  return <output data-testid="search">{search}</output>;
}

function setup(initialEntry = "/mypage/account?tab=sub") {
  const handlers = {
    onClickCreate: vi.fn(),
    onClickPermission: vi.fn(),
    onClickEdit: vi.fn(),
    onClickDelete: vi.fn(),
  };
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <SubAccountList activeAccountIdx={null} {...handlers} />
        <LocationProbe />
      </MemoryRouter>
    </SWRConfig>,
  );
  return { handlers, user: userEvent.setup() };
}

beforeEach(() => {
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockImplementation(respondSubAccounts as typeof serverApiV3.get);
});

describe("SubAccountList (PC 표)", () => {
  beforeEach(() => mockViewport(true));

  it("서버에 쪽·크기를 보내 받은 한 쪽을 그리고 쪽 번호를 그린다", async () => {
    setup();
    expect(await screen.findByText("sub01")).toBeInTheDocument();
    expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/sub", {
      params: { page: 1, size: PAGE_SIZE, keyword: undefined },
    });
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(1 + PAGE_SIZE); // 머리글 + 8행
    expect(screen.queryByText("sub09")).toBeNull();
    expect(screen.getByRole("link", { name: "3쪽" })).toBeInTheDocument();
  });

  it("불러오는 동안 스켈레톤을 보인다", () => {
    vi.mocked(serverApiV3.get).mockReturnValue(new Promise(() => undefined));
    setup();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("불러오지 못하면 다시 시도할 수 있다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValueOnce(new Error("network"));
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText("sub01")).toBeInTheDocument();
  });

  it("쪽 번호를 누르면 그 쪽으로 가고 주소 쿼리에 남는다", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("link", { name: "2쪽" }));
    expect(await screen.findByText("sub09")).toBeInTheDocument();
    expect(screen.queryByText("sub01")).toBeNull();
    expect(screen.getByTestId("search")).toHaveTextContent("page=2");
  });

  it("첫 쪽에서는 이전이 비활성이다", async () => {
    setup();
    expect(await screen.findByLabelText("이전")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("범위를 벗어난 쪽은 마지막 쪽으로 당긴다", async () => {
    setup("/mypage/account?tab=sub&page=9");
    expect(await screen.findByText("sub17")).toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveTextContent("page=3");
  });

  it("검색어를 Enter로 제출하면 searchType 없이 검색어만 보내 1쪽부터 보인다", async () => {
    const { user } = setup("/mypage/account?tab=sub&page=2");
    await user.type(
      await screen.findByRole("searchbox", { name: "Sub ID 검색" }),
      "sub23{Enter}",
    );
    expect(await screen.findByText("sub23")).toBeInTheDocument();
    expect(screen.queryByText("sub09")).toBeNull();
    expect(serverApiV3.get).toHaveBeenLastCalledWith("/mypage/account/sub", {
      params: { page: 1, size: PAGE_SIZE, keyword: "sub23" },
    });
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("keyword=sub23");
    expect(search).not.toContain("page=");
  });

  it("검색 결과가 없으면 표 머리글은 두고 안내를 보이며 쪽 이동은 숨긴다", async () => {
    const { user } = setup();
    await user.type(
      await screen.findByRole("searchbox", { name: "Sub ID 검색" }),
      "없는사람{Enter}",
    );
    expect(
      await screen.findByText("‘없는사람’에 대한 결과가 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "아이디" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).toBeNull();
  });

  it("Sub ID가 하나도 없으면 생성 안내를 보인다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      sub: [],
      pagingInfo: { page: 1, size: PAGE_SIZE, totalCount: 0, totalPage: 0 },
    });
    setup();
    expect(await screen.findByText("Sub ID가 없습니다.")).toBeInTheDocument();
  });

  it("권한 부여·수정·삭제·생성 버튼이 해당 항목을 넘겨 호출된다", async () => {
    const { user, handlers } = setup();
    await screen.findByText("sub01");
    const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1]!;
    await user.click(
      within(firstRow).getByRole("button", { name: "권한 부여" }),
    );
    expect(handlers.onClickPermission).toHaveBeenCalledWith(
      expect.objectContaining({ accountIdx: 9000, identifier: "sub01" }),
    );
    await user.click(within(firstRow).getByRole("button", { name: "수정" }));
    expect(handlers.onClickEdit).toHaveBeenCalledWith(
      expect.objectContaining({ accountIdx: 9000, identifier: "sub01" }),
    );
    await user.click(within(firstRow).getByRole("button", { name: "삭제" }));
    expect(handlers.onClickDelete).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "sub01" }),
    );
    await user.click(
      screen.getAllByRole("button", { name: "Sub ID 생성" })[0]!,
    );
    expect(handlers.onClickCreate).toHaveBeenCalled();
  });

  it("목록이 바뀌면 열어 둔 권한 부여·수정 쿼리는 지운다", async () => {
    for (const panel of ["permission", "edit"]) {
      const { user } = setup(
        `/mypage/account?tab=sub&panel=${panel}&subId=9001`,
      );
      await user.click(await screen.findByRole("link", { name: "2쪽" }));
      const search = screen.getByTestId("search").textContent ?? "";
      expect(search).not.toContain("panel=");
      expect(search).not.toContain("subId=");
      cleanup();
    }
  });

  it("목록이 바뀌어도 생성 패널 쿼리는 둔다", async () => {
    const { user } = setup("/mypage/account?tab=sub&panel=create");
    await user.click(await screen.findByRole("link", { name: "2쪽" }));
    expect(screen.getByTestId("search")).toHaveTextContent("panel=create");
  });
});

describe("SubAccountList (TAB·MO 카드)", () => {
  beforeEach(() => mockViewport(false));

  it("표 대신 항목별 카드로 보인다", async () => {
    setup();
    await screen.findByText("sub01");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("button", { name: "권한 부여" })).toHaveLength(
      PAGE_SIZE,
    );
    expect(screen.getAllByRole("button", { name: "수정" })).toHaveLength(
      PAGE_SIZE,
    );
  });
});
