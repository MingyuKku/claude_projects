import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";

import { SubAccountList } from "./SubAccountList";

function mockViewport(isTabletUp: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isTabletUp,
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
    onClickDelete: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SubAccountList activeAccountIdx={null} {...handlers} />
      <LocationProbe />
    </MemoryRouter>,
  );
  return { handlers, user: userEvent.setup() };
}

describe("SubAccountList (표)", () => {
  beforeEach(() => mockViewport(true));

  it("한 쪽에 8행을 보이고 목록에 맞는 쪽 번호를 그린다", () => {
    setup();
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(1 + 8); // 머리글 + 8행
    expect(screen.getByText("sub01")).toBeInTheDocument();
    expect(screen.queryByText("sub09")).toBeNull();
    expect(screen.getByRole("link", { name: "3쪽" })).toBeInTheDocument();
  });

  it("쪽 번호를 누르면 그 쪽으로 가고 주소 쿼리에 남는다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("link", { name: "2쪽" }));
    expect(screen.getByText("sub09")).toBeInTheDocument();
    expect(screen.queryByText("sub01")).toBeNull();
    expect(screen.getByTestId("search")).toHaveTextContent("page=2");
  });

  it("첫 쪽에서는 이전이 비활성이다", () => {
    setup();
    expect(screen.getByLabelText("이전")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("검색어를 Enter로 제출하면 1쪽부터 걸러 보인다", async () => {
    const { user } = setup("/mypage/account?tab=sub&page=2");
    await user.type(
      screen.getByRole("searchbox", { name: "Sub ID 검색" }),
      "sub23{Enter}",
    );
    expect(screen.getByText("sub23")).toBeInTheDocument();
    expect(screen.queryByText("sub01")).toBeNull();
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("keyword=sub23");
    expect(search).not.toContain("page=");
  });

  it("검색 결과가 없으면 표 머리글은 두고 안내를 보이며 쪽 이동은 숨긴다", async () => {
    const { user } = setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Sub ID 검색" }),
      "없는사람{Enter}",
    );
    expect(
      screen.getByText("‘없는사람’에 대한 결과가 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "아이디" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).toBeNull();
  });

  it("권한 부여·삭제·생성 버튼이 해당 항목을 넘겨 호출된다", async () => {
    const { user, handlers } = setup();
    const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1]!;
    await user.click(
      within(firstRow).getByRole("button", { name: "권한 부여" }),
    );
    expect(handlers.onClickPermission).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "sub01" }),
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

  it("목록이 바뀌면 열어 둔 권한 부여 쿼리는 지우고 생성 패널은 둔다", async () => {
    const { user } = setup(
      "/mypage/account?tab=sub&panel=permission&subId=9001",
    );
    await user.click(screen.getByRole("link", { name: "2쪽" }));
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).not.toContain("panel=");
    expect(search).not.toContain("subId=");
  });
});

describe("SubAccountList (MO 카드)", () => {
  beforeEach(() => mockViewport(false));

  it("표 대신 항목별 카드로 보인다", () => {
    setup();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("button", { name: "권한 부여" })).toHaveLength(
      8,
    );
  });
});
